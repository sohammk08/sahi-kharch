import multer from "multer";
import { speechToText } from "../lib/sarvam.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// POST /api/stt (multipart: file = audio, language = Sarvam code) → { transcript }
async function sttHandler(req, res) {
  if (!req.file) return res.status(400).json({ error: "No audio uploaded" });
  const language = req.body.language || "en-IN";
  try {
    const transcript = await speechToText(req.file.buffer, {
      languageCode: language,
      filename: req.file.originalname || "audio.webm",
    });
    res.json({ transcript });
  } catch (err) {
    console.error("stt error:", err.message);
    res.status(502).json({ error: err.message });
  }
}

export default [upload.single("file"), sttHandler];
