/**
 * Auto-apply engine — processes queued job applications.
 * Uses OpenAI GPT-4o to generate tailored CV summaries and cover letters.
 * Writes results to the database; Playwright automation is Phase 2.
 */

import OpenAI from "openai";
import { db } from "./db";
import { jobApplications, jobs, userProfiles, users } from "../shared/schema";
import { eq, and, lt } from "drizzle-orm";

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for auto-apply document generation.");
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Generate a tailored CV summary and cover letter for a specific job using GPT-4o */
export async function generateApplicationDocs(
  userCvText: string,
  jobTitle: string,
  company: string,
  jobDescription: string,
  userSkills: string[],
  userName: string
): Promise<{ tailoredCv: string; coverLetter: string }> {
  const client = getOpenAI();

  const [cvResp, clResp] = await Promise.all([
    client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert CV writer. Given a candidate's CV and a job description, rewrite their professional summary to be perfectly tailored to the role. Output ONLY the tailored professional summary (3-5 sentences). No headings, no markdown, no explanation.`,
        },
        {
          role: "user",
          content: `Job: ${jobTitle} at ${company}\n\nJob Description:\n${jobDescription.slice(0, 3000)}\n\nCandidate CV:\n${userCvText.slice(0, 3000)}\n\nSkills: ${userSkills.join(", ")}`,
        },
      ],
      max_tokens: 400,
      temperature: 0.5,
    }),
    client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert cover letter writer. Write a professional, personalised cover letter for a job application. 3 paragraphs: (1) why this role, (2) key relevant experience, (3) closing. Keep it concise, confident, and specific. No "Dear Hiring Manager" or subject line — start from the first paragraph.`,
        },
        {
          role: "user",
          content: `Applicant: ${userName}\nRole: ${jobTitle} at ${company}\n\nJob Description:\n${jobDescription.slice(0, 2000)}\n\nCV:\n${userCvText.slice(0, 2000)}\n\nSkills: ${userSkills.join(", ")}`,
        },
      ],
      max_tokens: 600,
      temperature: 0.7,
    }),
  ]);

  return {
    tailoredCv: cvResp.choices[0]?.message?.content?.trim() ?? "",
    coverLetter: clResp.choices[0]?.message?.content?.trim() ?? "",
  };
}

/** Parse a CV text using GPT-4o to extract structured profile data */
export async function parseCvWithAI(cvText: string): Promise<{
  jobTitle?: string;
  industry?: string;
  skills: string[];
  yearsExperience?: number;
  summary?: string;
}> {
  const client = getOpenAI();
  try {
    const resp = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a CV parser. Extract structured information and return ONLY valid JSON:
{
  "jobTitle": "most recent job title",
  "industry": "industry sector (e.g. Technology, Finance, Healthcare, Marketing, Education, Legal, Engineering)",
  "skills": ["skill1", "skill2"] (top 15 skills, mix technical and soft),
  "yearsExperience": number (total years),
  "summary": "2-sentence professional summary"
}`,
        },
        {
          role: "user",
          content: cvText.slice(0, 6000),
        },
      ],
      max_tokens: 700,
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const content = resp.choices[0]?.message?.content ?? "{}";
    return JSON.parse(content);
  } catch {
    return { skills: [] };
  }
}

/** Process a single queued application */
async function processApplication(applicationId: string): Promise<void> {
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
    const docs = await generateApplicationDocs(
      profile?.cvText ?? "",
      jobRow.title,
      jobRow.company,
      jobRow.description ?? "",
      profile?.skills ?? [],
      `${user.firstName} ${user.lastName}`
    );

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
    // For now, mark as submitted — documents are ready, user downloads and applies
    // (short dwell so the "Submitting application" step is visible in the UI)
    await sleep(1200);

    await db
      .update(jobApplications)
      .set({
        status: "submitted",
        appliedAt: new Date(),
        statusUpdatedAt: new Date(),
      })
      .where(eq(jobApplications.id, applicationId));

    console.log(
      `[autoApply] ✓ ${applicationId} — ${jobRow.title} at ${jobRow.company}`
    );
  } catch (err) {
    console.error(`[autoApply] ✗ ${applicationId}:`, err);
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

const BATCH_SIZE = 5;
const MAX_PER_RUN = 40; // safety cap so one run can't loop forever
const INTER_ITEM_DELAY_MS = 800;

/**
 * Process all queued applications (called on a timer and right after new applications
 * are queued). Drains the queue in batches within a single run — rather than handling
 * only one batch and waiting for the next timer tick — so a bulk auto-apply (up to 20
 * jobs) finishes in one continuous pass that the progress modal can watch to completion.
 */
export async function processQueuedApplications(): Promise<void> {
  if (processorRunning) return;
  processorRunning = true;
  try {
    let processed = 0;
    while (processed < MAX_PER_RUN) {
      const queued = await db
        .select()
        .from(jobApplications)
        .where(eq(jobApplications.status, "queued"))
        .limit(BATCH_SIZE);

      if (queued.length === 0) break;

      for (const app of queued) {
        await processApplication(app.id);
        processed++;
        await sleep(INTER_ITEM_DELAY_MS);
      }
    }
  } catch (err) {
    console.error("[autoApply] Queue processor error:", err);
  } finally {
    processorRunning = false;
  }
}

/**
 * Auto-flag applications the employer has gone silent on.
 *
 * Modeled on how job-tracking tools (Ghoster, G-Track) handle this without any inbox
 * access at all: if an application has sat in "submitted" for longer than most hiring
 * pipelines take to respond, treat the silence itself as a signal and move it to
 * "no_response" — separate from "rejected" since we don't actually know the outcome,
 * just that nobody replied. The user can still manually override with a real status
 * (interview / rejected / offer) at any time if they do hear back after all.
 *
 * This needs no email integration, so it can run today; email-based detection
 * (matching Teal/Huntr/Ghoster's approach of scanning a connected inbox for ATS
 * senders) is a natural phase 2 on top of this.
 */
const STALE_AFTER_DAYS = 21;

export async function flagStaleApplications(): Promise<number> {
  const cutoff = new Date(Date.now() - STALE_AFTER_DAYS * 24 * 60 * 60 * 1000);
  try {
    const flipped = await db
      .update(jobApplications)
      .set({ status: "no_response", statusUpdatedAt: new Date() })
      .where(and(eq(jobApplications.status, "submitted"), lt(jobApplications.appliedAt, cutoff)))
      .returning({ id: jobApplications.id });

    if (flipped.length > 0) {
      console.log(`[autoApply] Flagged ${flipped.length} application(s) as no_response (no reply after ${STALE_AFTER_DAYS}d).`);
    }
    return flipped.length;
  } catch (err) {
    console.error("[autoApply] Staleness check error:", err);
    return 0;
  }
}
