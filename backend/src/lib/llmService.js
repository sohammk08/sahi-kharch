import { postWithRetry } from "./retry.js";

const BASE = "https://api.groq.com/openai/v1/chat/completions";
const KEY = process.env.GROQ_API_KEY;
// Groq's OpenAI-compatible endpoint. Model ID must be a valid Groq model;
// openai/gpt-oss-20b unless overridden in .env (confirm availability on Groq).
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

// Ask the LLM for a JSON verdict given a system prompt and user context.
// Returns the raw content string, the caller validates/parses it.
export async function runVerdict({ system, user }) {
  const start = Date.now();
  const data = await postWithRetry(
    BASE,
    {
      model: MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    },
    { headers: { Authorization: `Bearer ${KEY}` } },
  );
  const content = data.choices?.[0]?.message?.content;
  console.log(`verdict: ${MODEL} in ${Date.now() - start}ms`);
  return content;
}
