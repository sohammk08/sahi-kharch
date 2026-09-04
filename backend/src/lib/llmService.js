import { postWithRetry } from "./retry.js";

const BASE = "https://api.groq.com/openai/v1/chat/completions";
const KEY = process.env.GROQ_API_KEY;
// Groq's OpenAI-compatible endpoint. Model ID must be a valid Groq model;
// openai/gpt-oss-20b unless overridden in .env (confirm availability on Groq).
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

// Ask the LLM for a JSON verdict given a system prompt and user context.
// Returns the raw content string; the caller validates/parses it. Retries
// once if the model returns malformed JSON, since that's cheap to recover
// from and boosts run-to-run consistency.
export async function runVerdict({ system, user }) {
  const start = Date.now();
  let content;
  for (let attempt = 0; attempt < 2; attempt++) {
    const messages = [
      { role: "system", content: system },
      { role: "user", content: user },
    ];
    if (attempt === 1) {
      messages.push({
        role: "user",
        content:
          "Your previous response was not valid JSON. Return ONLY the JSON object in the requested shape, nothing else.",
      });
    }
    const data = await postWithRetry(
      BASE,
      {
        model: MODEL,
        temperature: 0.2,
        messages,
        response_format: { type: "json_object" },
      },
      { headers: { Authorization: `Bearer ${KEY}` } },
    );
    content = data.choices?.[0]?.message?.content;
    if (typeof content === "string") {
      try {
        JSON.parse(content);
        break;
      } catch {
        continue;
      }
    }
  }
  if (typeof content !== "string") {
    throw new Error("LLM returned no content after retries");
  }
  console.log(`verdict: ${MODEL} in ${Date.now() - start}ms`);
  return content;
}
