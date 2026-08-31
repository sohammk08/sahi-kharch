import { translateText } from "../lib/sarvam.js";

// POST /api/translate — body { text, source?, target } → { translated }
async function translateHandler(req, res) {
  const { text, source, target } = req.body ?? {};
  if (!text || !target) {
    return res.status(400).json({ error: "text and target required" });
  }
  try {
    const translated = await translateText(text, {
      sourceLanguageCode: source || "en-IN",
      targetLanguageCode: target,
    });
    res.json({ translated });
  } catch (err) {
    console.error("translate error:", err.message);
    res.status(502).json({ error: err.message });
  }
}

export default translateHandler;
