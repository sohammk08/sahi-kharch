import { extractDocument } from "../lib/sarvam.js";

const RECEIPT_SCHEMA = {
  type: "object",
  properties: {
    vendor: {
      type: "string",
      description: "Name of the vendor or merchant on the receipt",
    },
    date: {
      type: "string",
      description: "Date on the receipt in DD/MM/YYYY format",
    },
    amount: {
      type: "number",
      description: "Total amount payable on the receipt",
    },
    currency: {
      type: "string",
      description: "Currency code or symbol, e.g. INR",
    },
    taxOrGST: {
      type: "string",
      description: "GST or tax amount or GSTIN shown on the receipt",
    },
    category: {
      type: "string",
      description: "Expense category: travel, meals, fuel, hotel, etc.",
    },
  },
};

const FIELDS = ["vendor", "date", "amount", "currency", "taxOrGST", "category"];

// POST /api/receipts/parse — accept a receipt file, run Sarvam Extract, return structured fields + confidence.
async function parseReceipt(req, res) {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    // Send the file to Sarvam for extraction. Waits until the job finishes.
    const { jobId, status, results } = await extractDocument(
      req.file.buffer,
      req.file.originalname,
      RECEIPT_SCHEMA,
    );

    // Only accept a fully (or mostly) successful extraction.
    if (status !== "completed" && status !== "partially_completed") {
      return res
        .status(422)
        .json({ error: "Sarvam extraction failed", status });
    }

    const extracted = {};
    const confidence = {};
    for (const field of FIELDS) {
      const value = results.result?.[field];
      const conf = results.annotations?.[field]?.confidence;
      extracted[field] = value ?? "not_found";
      confidence[field] = typeof conf === "number" ? conf : "not_found";
    }

    res.json({ jobId, extracted, confidence });
  } catch (err) {
    // Failure to reach/parse at the backend → log it, tell the client (502)
    console.error("receipt parse error:", err.message);
    res.status(502).json({ error: err.message });
  }
}

export default parseReceipt;
