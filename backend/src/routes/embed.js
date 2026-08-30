import { embed } from "../lib/embeddingService.js";

// POST /api/embed — body { texts: string[] } → { embeddings: number[][] }
async function embedHandler(req, res) {
  const { texts } = req.body ?? {};
  if (!texts || (Array.isArray(texts) && texts.length === 0)) {
    return res.status(400).json({ error: "texts (string[]) required" });
  }
  try {
    const embeddings = await embed(Array.isArray(texts) ? texts : [texts]);
    res.json({ embeddings });
  } catch (err) {
    console.error("embed error:", err.message);
    res.status(502).json({ error: err.message });
  }
}

export default embedHandler;
