import Groq from "groq-sdk";

let groq: Groq | null = null;

function getGroq(): Groq {
  if (!groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not set");
    }
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
}

export async function generateAIResponse(
  question: string,
  expertType: string,
  country: string
): Promise<string> {
  const client = getGroq();

  const expertContext =
    expertType === "immigration"
      ? "immigration law, visa applications, residency, citizenship, and relocation"
      : expertType === "travel"
      ? "travel planning, travel agents, visas for tourism, and international travel"
      : "tour guides, cultural experiences, safari tours, and guided travel";

  const systemPrompt = `You are an expert advisor on ${expertContext}. 
You provide clear, accurate, and helpful advice to people asking questions about ${expertContext}.
Keep responses concise but comprehensive — 2-4 paragraphs. 
Focus on practical, actionable advice. 
Always recommend consulting a licensed professional for specific legal advice.
The user is asking about matters related to ${country}.`;

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ],
    max_tokens: 800,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content ?? "An expert will review your question and respond shortly.";
}
