import { runVerdict } from "../lib/llmService.js";

// POST /api/verdict — body { system: string, user: string } → { content: string }
// Stateless: all context is passed in the body. The caller validates the JSON.
async function verdictHandler(req, res) {
  const { system, user } = req.body ?? {};
  if (!system || !user) {
    return res.status(400).json({ error: "system and user prompts required" });
  }
  try {
    const content = await runVerdict({ system, user });
    res.json({ content });
  } catch (err) {
    console.error("verdict error:", err.message);
    res.status(502).json({ error: err.message });
  }
}

export default verdictHandler;
