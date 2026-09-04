import {
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { apiCall } from "./api.js";
import { db } from "../firebase.js";
import { runRules, enforceRules } from "./rulesEngine.js";
import { computeRiskScore } from "./riskScore.js";
import { parseVerdict } from "./verdict.js";

function cosineSim(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

// Retrieves top-k policy clauses by cosine similarity against the query embedding
// Uses an O(n) brute-force scan, but should be replaced by a vector index if policies grow to thousands of clauses
async function retrieveClauses(policyId, queryEmbedding, k = 5) {
  const snap = await getDocs(collection(db, "policies", policyId, "clauses"));
  const clauses = snap.docs.map((d) => {
    const c = d.data();
    return {
      clauseId: c.clauseId,
      heading: c.heading,
      pageNumber: c.pageNumber,
      text: c.text,
      embedding: Array.isArray(c.embedding) ? c.embedding : null,
    };
  });
  const embedded = clauses
    .filter((c) => c.embedding)
    .map((c) => ({ ...c, score: cosineSim(queryEmbedding, c.embedding) }))
    .sort((a, b) => b.score - a.score);

  // No embeddings yet → fall back to first clauses so code doesn't break
  const pool = embedded.length ? embedded : clauses;
  return pool.slice(0, k).map(({ clauseId, heading, pageNumber, text }) => ({
    clauseId,
    heading,
    pageNumber,
    text,
  }));
}

function buildSystemPrompt() {
  return `You are an expense policy compliance officer. You are given an employee claim's receipt data, the relevant policy clauses (the ONLY source of truth), and the output of a deterministic rules check.

Return ONLY a JSON object in exactly this shape:
{"verdict":"approved|flagged|rejected|needs_human_review","citedClauseIds":["clauseId"],"reasoning":"plain english explanation","confidence":0.0}

Decision guidance:
- "approved": the claim clearly complies with the cited clauses.
- "rejected": the claim clearly violates a hard limit or the rules check found a critical violation.
- "flagged": the claim is borderline, ambiguous, or has minor non-compliance.
- "needs_human_review": you cannot decide from the clauses provided, or the rules check is inconclusive.

Cite ONLY clause IDs that appear in the provided clause list. Never invent or cite a clause that is not in the list. "confidence" is a number 0.0 to 1.0 representing how confident you are in the verdict.`;
}

function buildUserPrompt({ receiptData, retrievedClauses, rulesOutput }) {
  return JSON.stringify(
    {
      receiptData,
      policyClauses: retrievedClauses.map((c) => ({
        clauseId: c.clauseId,
        heading: c.heading,
        pageNumber: c.pageNumber,
        text: c.text,
      })),
      rulesCheck: rulesOutput,
      instruction: "Produce the verdict JSON now.",
    },
    null,
    2,
  );
}

function anomalyScore(rulesOutput) {
  let score = rulesOutput.violations.length * 15;
  if (rulesOutput.violations.some((v) => v.rule === "duplicate")) score += 40;
  return Math.min(score, 100);
}

// Batch-embed every clause of a policy and store vectors on the clause docs.
export async function embedClauses(policyId, onProgress) {
  const snap = await getDocs(collection(db, "policies", policyId, "clauses"));
  const docs = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
  const batch = writeBatch(db);
  let done = 0;
  for (let i = 0; i < docs.length; i += 50) {
    const chunk = docs.slice(i, i + 50);
    const { embeddings } = await apiCall("/api/embed", {
      method: "POST",
      body: { texts: chunk.map((d) => d.data.text) },
    });
    embeddings.forEach((emb, j) => {
      batch.update(doc(db, "policies", policyId, "clauses", chunk[j].id), {
        embedding: emb,
      });
    });
    done += chunk.length;
    onProgress?.(done, docs.length);
  }
  await batch.commit();
  return docs.length;
}

// Full decision pipeline: load context → rules → retrieve → LLM → score →
// evidence bundle → update claim → audit log.
export async function runVerdict({
  claimId,
  receiptId,
  policyId,
  employeeId,
  actorId,
  actorName,
  onStep,
}) {
  const step = (msg) => onStep?.(msg);

  step("Loading claim context…");
  const claimSnap = await getDoc(doc(db, "claims", claimId));
  const claim = { id: claimSnap.id, ...claimSnap.data() };
  const receiptSnap = await getDoc(doc(db, "receipts", receiptId));
  const receipt = { id: receiptSnap.id, ...receiptSnap.data() };
  const policySnap = await getDoc(doc(db, "policies", policyId));
  const policy = { id: policySnap.id, ...policySnap.data() };
  const employeeSnap = await getDoc(doc(db, "users", employeeId));
  const employee = employeeSnap.exists()
    ? { id: employeeSnap.id, ...employeeSnap.data() }
    : { name: null };

  step("Running deterministic rules…");
  const allReceipts = await getDocs(collection(db, "receipts"));
  const otherReceipts = allReceipts.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
  const rulesOutput = runRules(receipt, policy, otherReceipts);

  step("Embedding query and retrieving clauses…");
  const ext = receipt.extracted ?? {};

  const queryText = [ext.category, ext.vendor, ext.amount, ext.date]
    .filter(Boolean)
    .join(" ");

  const { embeddings } = await apiCall("/api/embed", {
    method: "POST",
    body: { texts: [queryText] },
  });
  const retrievedClauses = await retrieveClauses(policyId, embeddings[0]);

  step("Getting LLM judgment…");

  const system = buildSystemPrompt();
  const user = buildUserPrompt({
    receiptData: ext,
    retrievedClauses,
    rulesOutput,
  });

  const { content } = await apiCall("/api/verdict", {
    method: "POST",
    body: { system, user },
  });

  const llmOutput = parseVerdict(content);
  const knownIds = new Set(retrievedClauses.map((c) => c.clauseId));
  llmOutput.citedClauseIds = llmOutput.citedClauseIds.filter((id) =>
    knownIds.has(id),
  );
  enforceRules(llmOutput, rulesOutput);

  step("Computing risk score…");
  const riskScore = computeRiskScore({
    rulesOutput,
    receipt,
    anomalySignals: anomalyScore(rulesOutput),
    llm: llmOutput,
  });

  step("Saving evidence bundle…");

  const bundleRef = await addDoc(collection(db, "evidence_bundles"), {
    claimId,
    receiptData: ext,
    retrievedClauses,
    llmInput: { system, user },
    llmOutput: { content, parsed: llmOutput },
    reasoningTrace: llmOutput.reasoning,
    rulesEngineOutput: rulesOutput,
    riskScore,
    createdAt: serverTimestamp(),
  });

  step("Updating claim and writing audit log…");

  await updateDoc(doc(db, "claims", claimId), {
    status: "adjudicated",
    verdict: llmOutput.verdict,
    citedClauseIds: llmOutput.citedClauseIds,
    evidenceBundleId: bundleRef.id,
    riskScore,
    employeeName: employee.name,
    amount: ext.amount ?? null,
    category: ext.category ?? null,
    receiptDate: ext.date ?? null,
    adjudicatedAt: serverTimestamp(),
  });

  await addDoc(collection(db, "audit_log"), {
    claimId,
    timestamp: serverTimestamp(),
    action: "verdict_run",
    actorId,
    actorName,
    verdict: llmOutput.verdict,
    riskScore: riskScore.overall,
    citedClauseIds: llmOutput.citedClauseIds,
    evidenceBundleId: bundleRef.id,
    metadata: { policyId, employeeId, employeeName: employee.name },
  });

  step("Done.");
  return {
    claim,
    receipt,
    policy,
    rulesOutput,
    retrievedClauses,
    llmInput: { system, user },
    llmOutput,
    riskScore,
    evidenceBundleId: bundleRef.id,
  };
}

// Create a draft claim then run the verdict pipeline in one call.
export async function createClaimAndRunVerdict(args) {
  const claimRef = await addDoc(collection(db, "claims"), {
    receiptId: args.receiptId,
    policyId: args.policyId,
    employeeId: args.employeeId,
    batchId: args.batchId ?? null,
    status: "draft",
    createdAt: serverTimestamp(),
  });
  const result = await runVerdict({ ...args, claimId: claimRef.id });
  return { claimId: claimRef.id, ...result };
}

// Human decision on a claim (approve/reject/request more info). Writes the
// review fields back to the claim and appends a "human_override" audit entry.
export async function overrideClaim({
  claimId,
  decision,
  comment,
  actorId,
  actorName,
}) {
  const claimSnap = await getDoc(doc(db, "claims", claimId));
  const claim = claimSnap.exists()
    ? { id: claimSnap.id, ...claimSnap.data() }
    : {};

  await updateDoc(doc(db, "claims", claimId), {
    reviewStatus: decision,
    reviewedBy: actorId,
    reviewedByName: actorName,
    reviewComment: comment ?? "",
    reviewedAt: serverTimestamp(),
  });

  await addDoc(collection(db, "audit_log"), {
    claimId,
    timestamp: serverTimestamp(),
    action: "human_override",
    actorId,
    actorName,
    verdict: decision,
    comment: comment ?? "",
    evidenceBundleId: claim.evidenceBundleId ?? null,
    riskScore: claim.riskScore?.overall ?? null,
    metadata: {
      policyId: claim.policyId ?? null,
      employeeId: claim.employeeId ?? null,
      employeeName: claim.employeeName ?? null,
    },
  });
}

// Run the verdict pipeline over many (receipt, employee, policy) tuples. All
// claims share a batchId so the dashboard can filter to one batch.
// ponytail: client-side sequential LLM loop; move to a backend job queue if a
// batch is ever large (each claim = 1 embed + 1 LLM call).
export async function batchRun({ items, actorId, actorName, onProgress }) {
  const batchId =
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const total = items.length;
  let done = 0;
  for (const item of items) {
    await createClaimAndRunVerdict({
      ...item,
      batchId,
      actorId,
      actorName,
      onStep: (msg) => onProgress?.(done, total, msg),
    });
    done += 1;
    onProgress?.(done, total, "Done");
  }
  return batchId;
}
