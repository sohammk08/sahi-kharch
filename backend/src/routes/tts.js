import { textToSpeech } from "../lib/sarvam.js";

// POST /api/tts — body { text, language } → { audio: base64, format }
async function ttsHandler(req, res) {
  const { text, language } = req.body ?? {};
  if (!text || !language) {
    return res.status(400).json({ error: "text and language required" });
  }
  try {
    const audio = await textToSpeech(text, { targetLanguageCode: language });
    res.json({ audio, format: "wav" });
  } catch (err) {
    console.error("tts error:", err.message);
    res.status(502).json({ error: err.message });
  }
}

export default ttsHandler;
