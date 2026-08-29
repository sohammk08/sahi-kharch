import { extractPolicyText, chunkClauses } from "../lib/policyParser.js";

// POST /api/policies/parse — accept a policy PDF, extract text via pdf-parse, chunk into clauses.
export default async function parsePolicy(req, res) {
  // No file attached → reject early with a 400 (bad request)
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  // Only accept PDFs — check to ensure file's name ends in ".pdf"
  if (!req.file.originalname.toLowerCase().endsWith(".pdf")) {
    return res.status(400).json({ error: "Only PDF files are supported" });
  }

  try {
    // 1. Pull the plain text out of the PDF buffer.
    const text = await extractPolicyText(req.file.buffer);

    // 2. Split that text into numbered clauses.
    const clauses = chunkClauses(text);

    // 3. Send back how many clauses we found plus the list itself.
    res.json({ clauseCount: clauses.length, clauses });
  } catch (err) {
    // There's an error! Log it to the server console and send a 502 (bad gateway) back to the client.
    console.error("policy parse error:", err.message);
    res.status(502).json({ error: err.message });
  }
}
