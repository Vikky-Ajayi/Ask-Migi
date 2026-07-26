/**
 * Embedding & matching service.
 * Uses OpenAI text-embedding-3-small when OPENAI_API_KEY is set.
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

/** Build a searchable profile string from a user profile */
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
