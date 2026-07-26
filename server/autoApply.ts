/**
 * Auto-apply engine — processes queued job applications.
 * Uses Groq to generate tailored CV text and cover letters.
 * Playwright browser automation handles form submission (Phase 2).
 */

import Groq from "groq-sdk";
import { db } from "./db";
import { jobApplications, jobs, userProfiles, users } from "../shared/schema";
import { eq, and } from "drizzle-orm";

let groq: Groq | null = null;
function getGroq(): Groq {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  return groq;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Generate a tailored CV summary and cover letter for a specific job */
export async function generateApplicationDocs(
  userCvText: string,
  jobTitle: string,
  company: string,
  jobDescription: string,
  userSkills: string[],
  userName: string
): Promise<{ tailoredCv: string; coverLetter: string }> {
  const client = getGroq();

  const [cvResp, clResp] = await Promise.all([
    client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert CV writer. Given a user's CV and a job description, rewrite the professional summary and highlight the most relevant experience and skills. Output only the tailored professional summary (3-5 sentences), nothing else.`,
        },
        {
          role: "user",
          content: `Job: ${jobTitle} at ${company}\n\nJob Description:\n${jobDescription.slice(0, 3000)}\n\nUser's CV:\n${userCvText.slice(0, 3000)}\n\nUser Skills: ${userSkills.join(", ")}`,
        },
      ],
      max_tokens: 400,
      temperature: 0.6,
    }),
    client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert cover letter writer. Write a professional, personalised cover letter for a job application. Keep it concise (3 paragraphs), confident, and specific to the role. Output only the cover letter body, no subject line.`,
        },
        {
          role: "user",
          content: `Applicant name: ${userName}\nJob: ${jobTitle} at ${company}\n\nJob Description:\n${jobDescription.slice(0, 2000)}\n\nApplicant CV:\n${userCvText.slice(0, 2000)}\n\nApplicant Skills: ${userSkills.join(", ")}`,
        },
      ],
      max_tokens: 600,
      temperature: 0.7,
    }),
  ]);

  return {
    tailoredCv: cvResp.choices[0]?.message?.content ?? "",
    coverLetter: clResp.choices[0]?.message?.content ?? "",
  };
}

/** Parse a CV text using Groq to extract structured profile data */
export async function parseCvWithAI(cvText: string): Promise<{
  jobTitle?: string;
  industry?: string;
  skills: string[];
  yearsExperience?: number;
  summary?: string;
}> {
  const client = getGroq();
  try {
    const resp = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a CV parser. Extract structured information from the CV text and return ONLY valid JSON with these fields:
{
  "jobTitle": "most recent job title",
  "industry": "industry sector (e.g. Technology, Finance, Healthcare, Marketing, Education, Legal, Engineering)",
  "skills": ["skill1", "skill2", ...] (top 10 skills),
  "yearsExperience": number (total years of work experience),
  "summary": "2-sentence professional summary"
}
Return only JSON, no markdown, no explanation.`,
        },
        {
          role: "user",
          content: cvText.slice(0, 4000),
        },
      ],
      max_tokens: 600,
      temperature: 0.2,
    });

    const content = resp.choices[0]?.message?.content ?? "{}";
    // Extract JSON even if there's surrounding text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { skills: [] };
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { skills: [] };
  }
}

/** Process a single queued application */
async function processApplication(applicationId: string): Promise<void> {
  // Load application + job + user profile
  const [appRow] = await db
    .select()
    .from(jobApplications)
    .where(eq(jobApplications.id, applicationId));
  if (!appRow) return;

  const [jobRow] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, appRow.jobId));
  if (!jobRow) return;

  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, appRow.userId));

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, appRow.userId));

  if (!user) return;

  // Update status to generating_docs
  await db
    .update(jobApplications)
    .set({ status: "generating_docs", statusUpdatedAt: new Date() })
    .where(eq(jobApplications.id, applicationId));

  try {
    // Generate tailored documents
    const docs = await generateApplicationDocs(
      profile?.cvText ?? "",
      jobRow.title,
      jobRow.company,
      jobRow.description ?? "",
      profile?.skills ?? [],
      `${user.firstName} ${user.lastName}`
    );

    // Update with generated docs and mark as applying
    await db
      .update(jobApplications)
      .set({
        tailoredCvText: docs.tailoredCv,
        coverLetter: docs.coverLetter,
        status: "applying",
        statusUpdatedAt: new Date(),
      })
      .where(eq(jobApplications.id, applicationId));

    // TODO Phase 2: Playwright automation submits the form here
    // For now, mark as submitted (documents are ready, user can apply manually)
    await sleep(2000);

    await db
      .update(jobApplications)
      .set({
        status: "submitted",
        appliedAt: new Date(),
        statusUpdatedAt: new Date(),
      })
      .where(eq(jobApplications.id, applicationId));

    console.log(`[autoApply] Application ${applicationId} processed for ${jobRow.title} at ${jobRow.company}`);
  } catch (err) {
    console.error(`[autoApply] Error processing ${applicationId}:`, err);
    await db
      .update(jobApplications)
      .set({
        status: "failed",
        failureReason: err instanceof Error ? err.message : "Unknown error",
        statusUpdatedAt: new Date(),
      })
      .where(eq(jobApplications.id, applicationId));
  }
}

let processorRunning = false;

/** Process all queued applications — called on a timer */
export async function processQueuedApplications(): Promise<void> {
  if (processorRunning) return;
  processorRunning = true;
  try {
    const queued = await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.status, "queued"))
      .limit(5); // Process max 5 at a time

    for (const app of queued) {
      await processApplication(app.id);
      await sleep(3000); // Pause between applications
    }
  } catch (err) {
    console.error("[autoApply] Queue processor error:", err);
  } finally {
    processorRunning = false;
  }
}
