import { postWithRetry } from "./retry.js";

const BASE = "https://api.fireworks.ai/inference/v1/embeddings";
const KEY = process.env.FIREWORKS_API_KEY;
const MODEL = process.env.EMBEDDING_MODEL || "fireworks/qwen3-embedding-8b";
const DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS) || 1024;

// Embed one text or an array of texts. Returns a single vector for a single
// string input, or an array of vectors for an array input.
export async function embed(input) {
  const array = Array.isArray(input) ? input : [input];
  const start = Date.now();
  const data = await postWithRetry(
    BASE,
    { model: MODEL, input: array, dimensions: DIMENSIONS },
    { headers: { Authorization: `Bearer ${KEY}` } },
  );
  const vectors = data.data.map((d) => d.embedding);
  console.log(`embed: ${array.length} texts in ${Date.now() - start}ms`);
  return Array.isArray(input) ? vectors : vectors[0];
}
