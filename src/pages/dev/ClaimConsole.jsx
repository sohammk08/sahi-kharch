import { db } from "../../firebase.js";
import { useState, useEffect } from "react";
import RiskBars from "../../components/RiskBars";
import { useAuth } from "../../context/useAuth.js";
import { friendlyError } from "../../lib/errors.js";
import { collection, getDocs } from "firebase/firestore";
import { createClaimAndRunVerdict } from "../../lib/pipeline.js";
import { VERDICT_STYLES, fmtDate, receiptLabel } from "../../lib/ui.js";

function ClaimConsole() {
  const { user, profile } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [receiptId, setReceiptId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [policyId, setPolicyId] = useState("");
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showTrace, setShowTrace] = useState(false);

  useEffect(() => {
    Promise.all([
      getDocs(collection(db, "receipts")),
      getDocs(collection(db, "users")),
      getDocs(collection(db, "policies")),
    ])
      .then(([r, u, p]) => {
        setReceipts(r.docs.map((d) => ({ id: d.id, ...d.data() })));
        setEmployees(u.docs.map((d) => ({ id: d.id, ...d.data() })));
        setPolicies(p.docs.map((d) => ({ id: d.id, ...d.data() })));
      })
      .finally(() => setLoadingData(false));
  }, []);

  const canRun = receiptId && employeeId && policyId && !running;

  const handleRun = async () => {
    setRunning(true);
    setError("");
    setResult(null);
    setStep("");
    try {
      const res = await createClaimAndRunVerdict({
        receiptId,
        employeeId,
        policyId,
        actorId: user.uid,
        actorName: profile?.name ?? user.email,
        onStep: setStep,
      });
      setResult(res);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setRunning(false);
      setStep("");
    }
  };

  return (
    <main className="bg-[#f7f7f5] text-black">
      <div className="mx-auto max-w-6xl px-8 py-16 md:px-12">
        <h1 className="eyebrow">Claim Console</h1>
        <p className="mt-3 body">
          Internal test harness — simulate a claim and run the full decision
          pipeline.
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
                  {loadingData ? "Loading…" : "Select a receipt"}
                </option>
                {receipts.map((r) => (
                  <option key={r.id} value={r.id}>
                    {receiptLabel(r)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="body-sm font-[480]">Employee</span>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="rounded-lg border border-[#e6e6e6] bg-white px-3.5 py-3 body-sm"
              >
                <option value="">
                  {loadingData ? "Loading…" : "Select an employee"}
                </option>
                {employees.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || "Unnamed"} — {u.email}
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
                  {loadingData ? "Loading…" : "Select a policy"}
                </option>
                {policies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({fmtDate(p.effectiveFromDate)})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            onClick={handleRun}
            disabled={!canRun}
            className="mt-6 rounded-[50px] bg-black px-6 py-3 text-[20px] font-[480] text-white disabled:opacity-50"
          >
            {running ? step || "Running…" : "Run Verdict"}
          </button>
          {error && <p className="mt-4 body text-[#ff3d8b]">{error}</p>}
        </div>

        {result && (
          <div className="mt-10 space-y-8">
            <div className="rounded-3xl border border-[#e6e6e6] bg-white p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="caption text-black/50">Verdict</p>
                  <span
                    className={`mt-2 inline-block rounded-full px-4 py-1.5 ${VERDICT_STYLES[result.llmOutput.verdict]?.cls ?? "bg-[#f1f1f1]"}`}
                  >
                    {VERDICT_STYLES[result.llmOutput.verdict]?.label ??
                      result.llmOutput.verdict}
                  </span>
                  <p className="mt-3 body text-black/80">
                    {result.llmOutput.reasoning}
                  </p>
                </div>
                <div className="w-full max-w-xs">
                  <RiskBars risk={result.riskScore} />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#e6e6e6] bg-white p-8">
              <h2 className="headline">Cited clauses</h2>
              {result.llmOutput.citedClauseIds.length === 0 ? (
                <p className="mt-3 body text-black/60">No clauses cited.</p>
              ) : (
                <div className="mt-5 space-y-4">
                  {result.llmOutput.citedClauseIds.map((id) => {
                    const clause = result.retrievedClauses.find(
                      (c) => c.clauseId === id,
                    );
                    return (
                      <blockquote
                        key={id}
                        className="rounded-2xl border-l-4 border-[#1f1d3d] bg-[#f7f7f5] p-5"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="caption rounded-full bg-[#1f1d3d] px-3 py-1 text-white">
                            {id}
                          </span>
                          {clause && (
                            <>
                              <span className="body-sm font-[540]">
                                {clause.heading}
                              </span>
                              <span className="caption text-black/40">
                                p.{clause.pageNumber}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="mt-3 body text-black/80">
                          {clause?.text ??
                            "Clause not in retrieval set (retrieval flag)"}
                        </p>
                      </blockquote>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-[#e6e6e6] bg-white p-8">
              <button
                onClick={() => setShowTrace((v) => !v)}
                className="headline flex items-center gap-2"
              >
                <span>Raw reasoning trace</span>
                <span className="caption text-black/40">
                  {showTrace ? "Hide" : "Show"}
                </span>
              </button>
              {showTrace && (
                <pre className="mt-5 max-h-120 overflow-auto rounded-2xl bg-[#f7f7f5] p-5 font-mono text-[13px] leading-relaxed text-black/80">
                  {JSON.stringify(
                    {
                      claimId: result.claimId,
                      receiptData: result.receipt.extracted ?? {},
                      rulesEngineOutput: result.rulesOutput,
                      retrievedClauses: result.retrievedClauses,
                      llmInput: result.llmInput,
                      llmOutput: result.llmOutput,
                      riskScore: result.riskScore,
                      evidenceBundleId: result.evidenceBundleId,
                    },
                    null,
                    2,
                  )}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default ClaimConsole;
