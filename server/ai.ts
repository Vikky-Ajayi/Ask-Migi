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
The user is asking about matters related to ${country}.
At the very end of your response, add one final sentence spoken in first person as the expert that creates urgency and personal value — something like "I can tell you exactly which [specific option/route/path] fits your situation and what your [chances/next steps/timeline] look like." Make it specific to what the user asked about.`;

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

export async function generateCasualReply(message: string): Promise<string> {
  const client = getGroq();

  const systemPrompt = `You are Ask MiGi's friendly assistant. Users sometimes send greetings, thanks, compliments, or short casual messages instead of career/immigration questions.
Respond warmly and briefly (1–2 sentences max). Acknowledge the message, then gently invite them to ask their career, immigration, or visa-related question.
Be conversational and encouraging. Do not start with "I" and do not use emojis.`;

  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 80,
      temperature: 0.8,
    });
    return completion.choices[0]?.message?.content ?? "Great to hear from you! Feel free to ask any career or immigration question — I'm here to help.";
  } catch {
    return "Great to hear from you! Feel free to ask any career or immigration question — I'm here to help.";
  }
}

export async function generateQuestionAnalysis(
  question: string,
  expertType: string,
  country: string
): Promise<string> {
  const client = getGroq();

  const expertContext =
    expertType === "immigration"
      ? "immigration and visa matters"
      : expertType === "travel"
      ? "travel planning and logistics"
      : "tours and local experiences";

  const systemPrompt = `You are a helpful assistant that briefly acknowledges and analyses user questions about ${expertContext} related to ${country}.
Write exactly 2–3 sentences. Do NOT answer the question — only:
1. Acknowledge what the user is asking about
2. Note the key factors or considerations involved
Keep it concise, warm, and professional. Do not use bullet points or headers.`;

  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyse this question briefly: ${question}` },
      ],
      max_tokens: 120,
      temperature: 0.5,
    });

    return completion.choices[0]?.message?.content ?? "";
  } catch {
    return "";
  }
}
