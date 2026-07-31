/**
 * Embedding & matching service.
 * Uses OpenAI GPT-4o-mini for AI-powered matching when OPENAI_API_KEY is set.
 * Falls back to TF-IDF keyword similarity when not set.
 */

import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  const client = getOpenAI();
  if (!client) return null;
  try {
    const resp = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000),
    });
    return resp.data[0].embedding;
  } catch (err) {
    console.error("[embeddings] OpenAI embedding failed:", err);
    return null;
  }
}

// ── Keyword-based fallback similarity ─────────────────────────────────────────
function tokenise(text: string): Map<string, number> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  return freq;
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, magA = 0, magB = 0;
  Array.from(a.entries()).forEach(([k, v]) => {
    dot += v * (b.get(k) ?? 0);
    magA += v * v;
  });
  Array.from(b.values()).forEach((v) => { magB += v * v; });
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/** Score a piece of text against a profile — returns 0-1 */
export function keywordScore(profileText: string, targetText: string): number {
  return cosineSimilarity(tokenise(profileText), tokenise(targetText));
}

/** Build a searchable profile string from a user profile (for keyword fallback) */
export function buildProfileText(profile: {
  industry?: string | null;
  jobTitle?: string | null;
  skills?: string[] | null;
  cvText?: string | null;
}): string {
  return [
    profile.industry ?? "",
    profile.jobTitle ?? "",
    (profile.skills ?? []).join(" "),
    (profile.cvText ?? "").slice(0, 2000),
  ]
    .join(" ")
    .trim();
}

/** Build a structured profile summary for the AI prompt */
export function buildProfileSummary(profile: {
  industry?: string | null;
  jobTitle?: string | null;
  skills?: string[] | null;
  targetRoles?: string[] | null;
  workTypes?: string[] | null;
  locationCity?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  yearsExperience?: number | null;
  cvText?: string | null;
}): string {
  const parts: string[] = [];
  if (profile.jobTitle) parts.push(`Current/Target Title: ${profile.jobTitle}`);
  if (profile.industry) parts.push(`Industry: ${profile.industry}`);
  if (profile.yearsExperience) parts.push(`Experience: ${profile.yearsExperience} years`);
  if (profile.skills?.length) parts.push(`Skills: ${profile.skills.slice(0, 25).join(", ")}`);
  if (profile.targetRoles?.length) parts.push(`Target Roles: ${profile.targetRoles.join(", ")}`);
  if (profile.workTypes?.length) parts.push(`Work Preference: ${profile.workTypes.join(", ")}`);
  if (profile.locationCity) parts.push(`Location: ${profile.locationCity}`);
  if (profile.salaryMin || profile.salaryMax) {
    parts.push(`Salary Range: £${profile.salaryMin ?? 0}–£${profile.salaryMax ?? "open"}`);
  }
  if (profile.cvText) {
    parts.push(`CV Highlights: ${profile.cvText.slice(0, 600)}`);
  }
  return parts.join("\n");
}

/**
 * AI-powered batch ranking using GPT-4o-mini.
 * Candidates is an array of {id, text} where text is a compact description.
 * Returns scored candidates sorted by score descending.
 * Falls back to keyword scoring if OpenAI is unavailable.
 */
export async function rankCandidatesWithAI(
  profileSummary: string,
  candidates: Array<{ id: string; text: string }>,
  context: "job" | "event" = "job"
): Promise<Array<{ id: string; score: number }>> {
  if (candidates.length === 0) return [];

  const client = getOpenAI();

  // No API key — use keyword fallback
  if (!client) {
    console.warn("[ai-match] No OPENAI_API_KEY — using keyword fallback");
    return candidates
      .map((c) => ({ id: c.id, score: keywordScore(profileSummary, c.text) * 100 }))
      .sort((a, b) => b.score - a.score);
  }

  const BATCH_SIZE = 60;
  const allScores: Array<{ id: string; score: number }> = [];

  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);

    const listText = batch
      .map((c, idx) => `${idx + 1}. [ID:${c.id}] ${c.text}`)
      .join("\n");

    const systemPrompt = context === "job"
      ? `You are an expert career matching AI. Your job is to rate how well each job opportunity matches a candidate's profile. Be specific and consider title alignment, skills overlap, location, work type preference, and salary fit.`
      : `You are a professional networking event matcher. Rate how relevant each event is for a professional's career development and networking goals based on their profile.`;

    const userPrompt = `CANDIDATE PROFILE:
${profileSummary}

${context.toUpperCase()}S TO RATE (${batch.length} total):
${listText}

Rate each ${context} from 0 to 100 (0 = irrelevant, 100 = perfect match).
Return ONLY a valid JSON object: {"scores": [{"id": "<exact_id>", "score": <number>}, ...]}
Include ALL ${batch.length} items. Use the exact IDs from the list.`;

    try {
      const resp = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0,
        max_tokens: 3000,
        response_format: { type: "json_object" },
      });

      const content = resp.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(content);

      // Handle various response shapes
      const arr: any[] = Array.isArray(parsed)
        ? parsed
        : parsed.scores ?? parsed.results ?? parsed.matches ?? parsed.items ?? [];

      if (Array.isArray(arr)) {
        allScores.push(
          ...arr
            .filter((item) => typeof item?.id === "string" && typeof item?.score === "number")
            .map((item) => ({ id: String(item.id), score: Number(item.score) }))
        );
      } else {
        throw new Error("Unexpected AI response shape");
      }
    } catch (err) {
      console.error(`[ai-match] GPT ranking failed for batch starting at ${i}:`, err);
      // Keyword fallback for this batch
      batch.forEach((c) =>
        allScores.push({ id: c.id, score: keywordScore(profileSummary, c.text) * 100 })
      );
    }
  }

  // Sort by score descending and return
  return allScores.sort((a, b) => b.score - a.score);
}
