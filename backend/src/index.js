import "dotenv/config";
import cors from "cors";
import multer from "multer";
import express from "express";
import stt from "./routes/stt.js";
import tts from "./routes/tts.js";
import embed from "./routes/embed.js";
import verdict from "./routes/verdict.js";
import policies from "./routes/policies.js";
import receipts from "./routes/receipts.js";
import translate from "./routes/translate.js";

const app = express();

// Accept uploaded files, keep them in memory & cap at 50MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

app.use(cors());
app.use(express.json());

// When the browser POSTs a file to these URLs, grab the uploaded file (as "file")
// and hand it to the corresponding parse handler:
app.post("/api/receipts/parse", upload.single("file"), receipts);
app.post("/api/policies/parse", upload.single("file"), policies);
app.post("/api/embed", embed);
app.post("/api/verdict", verdict);
app.post("/api/translate", translate);
app.post("/api/tts", tts);
app.post("/api/stt", stt);

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

const port = process.env.PORT || 4000;
app.listen(port, () =>
  console.log(`Sahi Kharch backend on http://localhost:${port}`),
);
