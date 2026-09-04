import "dotenv/config";
import cors from "cors";
import multer from "multer";
import express from "express";
import stt from "./routes/stt.js";
import tts from "./routes/tts.js";
import embed from "./routes/embed.js";
import payout from "./routes/payout.js";
import webhook from "./routes/webhook.js";
import verdict from "./routes/verdict.js";
import policies from "./routes/policies.js";
import receipts from "./routes/receipts.js";
import translate from "./routes/translate.js";
import payoutAdvance from "./routes/payoutAdvance.js";

const app = express();

// Accept uploaded files, keep them in memory & cap at 50MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

app.use(cors());

// RazorpayX signs the raw body, so the webhook must read it as a Buffer before
// the global express.json() below parses everything into objects.
app.post(
  "/api/webhook/razorpayx",
  express.raw({ type: "application/json" }),
  webhook,
);

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
app.post("/api/payout", payout);
app.post("/api/payout/advance", payoutAdvance);

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Fail fast at startup if required API keys are missing — a half-configured
// server otherwise turns the first request into a cryptic 502.
const REQUIRED_ENV = ["SARVAM_API_KEY", "FIREWORKS_API_KEY", "GROQ_API_KEY"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(
    `Missing required env: ${missing.join(", ")}. Copy backend/.env.example → backend/.env`,
  );
  process.exit(1);
}

// Unknown routes → JSON 404 instead of Express's default HTML page.
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// Global error handler: multer errors (e.g. oversized uploads) and any error
// escaping a route become a clean JSON response instead of an HTML stack trace.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.name === "MulterError" ? 400 : 500;
  console.error("unhandled error:", err.message);
  res.status(status).json({ error: err.message });
});

const port = process.env.PORT || 4000;
app.listen(port, () =>
  console.log(`Sahi Kharch backend on http://localhost:${port}`),
);
