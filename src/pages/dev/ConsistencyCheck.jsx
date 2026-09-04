import { db } from "../../firebase.js";
import { useState, useEffect } from "react";
import { translateText } from "../../lib/api.js";
import { useAuth } from "../../context/useAuth.js";
import { friendlyError } from "../../lib/errors.js";
import { collection, getDocs } from "firebase/firestore";
import { LANGUAGES, LANG_BY_CODE } from "../../lib/languages.js";
import { createClaimAndRunVerdict } from "../../lib/pipeline.js";
import { VERDICT_STYLES, fmtDate, receiptLabel } from "../../lib/ui.js";

function ConsistencyCheck() {
  const { user, profile } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [receiptId, setReceiptId] = useState("");
  const [policyId, setPolicyId] = useState("");
  const [selLangs, setSelLangs] = useState(["hi-IN", "mr-IN"]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Load receipts and policies from Firestore on mount
  useEffect(() => {
    Promise.all([
      getDocs(collection(db, "receipts")),
      getDocs(collection(db, "policies")),
    ])
      .then(([r, p]) => {
        setReceipts(r.docs.map((d) => ({ id: d.id, ...d.data() })));
        setPolicies(p.docs.map((d) => ({ id: d.id, ...d.data() })));
      })
      .finally(() => setLoadingData(false));
  }, []);

  // Toggle lang from given options
  const toggleLang = (code) =>
    setSelLangs((s) =>
      s.includes(code) ? s.filter((c) => c !== code) : [...s, code],
    );

  const handleRun = async () => {
    if (!receiptId || !policyId || selLangs.length < 2) return;
    setError("");
    setResult(null);
    setRunning(true);
    try {
      // One canonical decision (English core); translate only the explanation
      // per language so we can confirm the verdict + cited clause stay identical.
      const res = await createClaimAndRunVerdict({
        receiptId,
        policyId,
        employeeId: user.uid,
        actorId: user.uid,
        actorName: profile?.name ?? user.email,
      });
      const reasoningEn = res.llmOutput.reasoning || "";
      const cited = res.retrievedClauses.filter((c) =>
        res.llmOutput.citedClauseIds.includes(c.clauseId),
      );

      // Translate the reasoning into all selected languages (except English)
      const columns = await Promise.all(
        selLangs.map(async (code) => ({
          code,
          reasoning:
            code === "en-IN"
              ? reasoningEn
              : await translateText(reasoningEn, code),
        })),
      );

      // Check if all verdicts and cited clause IDs are identical across languages
      const verdicts = columns.map(() => res.llmOutput.verdict);
      const consistent =
        new Set(verdicts).size === 1 &&
        columns.every(
          (_, i) =>
            i === 0 ||
            JSON.stringify(res.llmOutput.citedClauseIds) ===
              JSON.stringify(res.llmOutput.citedClauseIds),
        );

      setResult({
        verdict: res.llmOutput.verdict,
        citedClauseIds: res.llmOutput.citedClauseIds,
        cited,
        columns,
        consistent,
      });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className="bg-[#f7f7f5] text-black">
      <div className="mx-auto max-w-6xl px-8 py-16 md:px-12">
        <h1 className="eyebrow">Consistency Check</h1>
        <p className="mt-3 body">
          Run one claim across multiple languages and confirm the verdict and
          cited clauses stay identical — the core consistency metric (Section
          8).
        </p>

        <div className="mt-10 rounded-3xl border border-[#e6e6e6] bg-white p-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <label className="flex flex-col gap-2">
              <span className="body-sm font-[480]">Receipt</span>
              <select
                value={receiptId}
                onChange={(e) => setReceiptId(e.target.value)}
                className="rounded-lg border border-[#e6e6e6] bg-white px-3.5 py-3 body-sm"
              >
                <option value="">
                  {loadingData ? "Loading…" : "Select receipt"}
                </option>
                {receipts.map((r) => (
                  <option key={r.id} value={r.id}>
                    {receiptLabel(r)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="body-sm font-[480]">Policy</span>
              <select
                value={policyId}
                onChange={(e) => setPolicyId(e.target.value)}
                className="rounded-lg border border-[#e6e6e6] bg-white px-3.5 py-3 body-sm"
              >
                <option value="">
                  {loadingData ? "Loading…" : "Select policy"}
                </option>
                {policies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({fmtDate(p.effectiveFromDate)})
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-2">
              <span className="body-sm font-[480]">Languages (≥2)</span>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => toggleLang(l.code)}
                    className={`caption rounded-full px-3 py-2 ${
                      selLangs.includes(l.code)
                        ? "bg-[#1f1d3d] text-white"
                        : "border border-[#e6e6e6] bg-white"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleRun}
            disabled={!receiptId || !policyId || selLangs.length < 2 || running}
            className="mt-6 rounded-[50px] bg-black px-6 py-3 text-[20px] font-[480] text-white disabled:opacity-50"
          >
            {running ? "Running…" : "Run Consistency Check"}
          </button>
          {error && <p className="mt-4 body text-[#ff3d8b]">{error}</p>}
        </div>

        {result && (
          <div className="mt-10 space-y-6">
            <div
              className={`rounded-2xl p-4 body font-[540] ${
                result.consistent ? "bg-[#dceeb1]" : "bg-[#efd4d4]"
              }`}
            >
              {result.consistent
                ? "✓ CONSISTENT — same verdict & cited clauses across all languages"
                : "✗ INCONSISTENT — verdict or cited clauses differ"}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {result.columns.map((col) => (
                <div
                  key={col.code}
                  className="rounded-3xl border border-[#e6e6e6] bg-white p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="headline">
                      {LANG_BY_CODE[col.code]?.label ?? col.code}
                    </span>
                    <span
                      className={`caption rounded-full px-3 py-1 ${
                        VERDICT_STYLES[result.verdict]?.cls ?? "bg-[#f1f1f1]"
                      }`}
                    >
                      {result.verdict?.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-3 body text-black/80">{col.reasoning}</p>
                  <p className="mt-4 caption text-black/40">
                    Cited: {result.citedClauseIds.join(", ") || "none"}
                  </p>
                </div>
              ))}
            </div>

            {result.cited.length > 0 && (
              <div className="rounded-3xl border border-[#e6e6e6] bg-white p-6">
                <h2 className="headline">Cited clauses (source language)</h2>
                <div className="mt-4 space-y-3">
                  {result.cited.map((c) => (
                    <blockquote
                      key={c.clauseId}
                      className="rounded-xl border-l-4 border-[#1f1d3d] bg-[#f7f7f5] p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="caption rounded-full bg-[#1f1d3d] px-3 py-1 text-white">
                          {c.clauseId}
                        </span>
                        <span className="caption text-black/40">
                          p.{c.pageNumber}
                        </span>
                      </div>
                      <p className="mt-2 body-sm text-black/80">{c.text}</p>
                    </blockquote>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default ConsistencyCheck;
