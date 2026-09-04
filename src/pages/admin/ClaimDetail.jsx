import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase.js";
import { fmtTime } from "../../lib/ui.js";
import { useParams } from "react-router-dom";
import { TbFileDescription } from "react-icons/tb";
import { useAuth } from "../../context/useAuth.js";
import { friendlyError } from "../../lib/errors.js";
import RiskBars from "../../components/RiskBars.jsx";
import { overrideClaim } from "../../lib/pipeline.js";
import { useState, useEffect, useCallback } from "react";
import { disburseClaim, advancePayout } from "../../lib/api.js";

const FIELD_LABELS = {
  vendor: "Vendor",
  date: "Date",
  amount: "Amount",
  currency: "Currency",
  taxOrGST: "Tax / GST",
  category: "Category",
};

const ACTION_STYLES = {
  approved: { label: "Approve", cls: "bg-[#dceeb1] text-black" },
  rejected: { label: "Reject", cls: "bg-[#efd4d4] text-black" },
  more_info: { label: "Request More Info", cls: "bg-[#f4ecd6] text-black" },
};

function ClaimDetail() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claim, setClaim] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [bundle, setBundle] = useState(null);
  const [history, setHistory] = useState([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [disbursing, setDisbursing] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const loadClaim = useCallback(async () => {
    try {
      const cSnap = await getDoc(doc(db, "claims", id));
      const c = { id: cSnap.id, ...cSnap.data() };
      setClaim(c);

      const [rSnap, eSnap, bSnap, hSnap] = await Promise.all([
        c.receiptId ? getDoc(doc(db, "receipts", c.receiptId)) : null,
        c.employeeId ? getDoc(doc(db, "users", c.employeeId)) : null,
        c.evidenceBundleId
          ? getDoc(doc(db, "evidence_bundles", c.evidenceBundleId))
          : null,
        getDocs(query(collection(db, "audit_log"), where("claimId", "==", id))),
      ]);

      setReceipt(rSnap?.exists() ? { id: rSnap.id, ...rSnap.data() } : null);
      setEmployee(eSnap?.exists() ? { id: eSnap.id, ...eSnap.data() } : null);
      setBundle(bSnap?.exists() ? { id: bSnap.id, ...bSnap.data() } : null);
      setHistory(
        hSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort(
            (a, b) =>
              (a.timestamp?.toMillis?.() ?? 0) -
              (b.timestamp?.toMillis?.() ?? 0),
          ),
      );
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    (async () => {
      await loadClaim();
    })();
  }, [loadClaim]);

  const handleDecision = async (decisionValue) => {
    if (submitting || !decisionValue) return;
    setSubmitting(true);
    setError("");
    try {
      await overrideClaim({
        claimId: id,
        decision: decisionValue,
        comment,
        actorId: user.uid,
        actorName: profile?.name ?? user.email,
      });
      await loadClaim();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisburse = async () => {
    if (disbursing) return;
    setDisbursing(true);
    setError("");
    try {
      await disburseClaim(id);
      await loadClaim();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setDisbursing(false);
    }
  };

  const handleAdvance = async () => {
    if (advancing) return;
    setAdvancing(true);
    setError("");
    try {
      await advancePayout(id);
      await loadClaim();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setAdvancing(false);
    }
  };

  const ext = receipt?.extracted ?? {};
  const cited = claim?.citedClauseIds ?? [];
  const citedClauses =
    bundle?.retrievedClauses?.filter((c) => cited.includes(c.clauseId)) ?? [];

  if (loading)
    return (
      <main className="bg-[#f7f7f5]">
        <div className="mx-auto max-w-6xl px-8 py-16">
          <p className="body">Loading…</p>
        </div>
      </main>
    );

  return (
    <main className="bg-[#f7f7f5] text-black">
      <div className="mx-auto max-w-6xl px-8 py-16 md:px-12">
        <p className="eyebrow">Claim {id.slice(0, 8)}</p>
        <h1 className="mt-1 headline">
          {employee?.name ?? "Unknown employee"}
        </h1>
        <p className="mt-2 body text-black/60">
          Submitted {fmtTime(claim?.createdAt)} ·{" "}
          {claim?.reviewStatus
            ? `Reviewed: ${claim.reviewStatus.replace("_", " ")}`
            : "Awaiting review"}
        </p>

        {error && <p className="mt-4 body text-[#ff3d8b]">{error}</p>}

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="space-y-8">
            {/* Receipt placeholder card */}
            <section className="rounded-3xl border border-[#e6e6e6] bg-white p-6">
              <h2 className="headline">Source</h2>
              <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl bg-[#f1f1f1] py-14 text-black/50">
                <TbFileDescription className="size-12" />
                <span className="body-sm">
                  {receipt?.fileName ?? "Receipt"}
                </span>
              </div>
            </section>

            {/* Extracted fields */}
            <section className="rounded-3xl border border-[#e6e6e6] bg-white p-6">
              <h2 className="headline">Extracted fields</h2>
              {Object.keys(ext).length === 0 ? (
                <p className="mt-3 body text-black/60">No extracted fields.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {Object.entries(ext).map(([k, v]) => (
                    <li
                      key={k}
                      className="flex items-center justify-between gap-4 rounded-xl border border-[#f1f1f1] bg-[#f7f7f5] px-4 py-3"
                    >
                      <span className="caption text-black/50">
                        {FIELD_LABELS[k] ?? k}
                      </span>
                      <span className="body font-[480]">
                        {k === "amount" && typeof v === "number"
                          ? `₹${v.toLocaleString("en-IN")}`
                          : String(v ?? "—")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Cited clauses */}
            <section className="rounded-3xl border border-[#e6e6e6] bg-white p-6">
              <h2 className="headline">Cited clauses</h2>
              {citedClauses.length === 0 ? (
                <p className="mt-3 body text-black/60">No clauses cited.</p>
              ) : (
                <div className="mt-5 space-y-4">
                  {citedClauses.map((c) => (
                    <blockquote
                      key={c.clauseId}
                      className="rounded-2xl border-l-4 border-[#1f1d3d] bg-[#f7f7f5] p-5"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="caption rounded-full bg-[#1f1d3d] px-3 py-1 text-white">
                          {c.clauseId}
                        </span>
                        {c.heading && (
                          <span className="body-sm font-[540]">
                            {c.heading}
                          </span>
                        )}
                        {c.pageNumber != null && (
                          <span className="caption text-black/40">
                            p.{c.pageNumber}
                          </span>
                        )}
                      </div>
                      <p className="mt-3 body text-black/80">{c.text}</p>
                    </blockquote>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-8">
            {/* Risk breakdown */}
            <section className="rounded-3xl border border-[#e6e6e6] bg-white p-6">
              <h2 className="headline">Risk breakdown</h2>
              {claim?.riskScore ? (
                <div className="mt-5">
                  <RiskBars risk={claim.riskScore} />
                </div>
              ) : (
                <p className="mt-3 body text-black/60">No risk score.</p>
              )}
            </section>

            {/* Decision */}
            <section className="rounded-3xl border border-[#e6e6e6] bg-white p-6">
              <h2 className="headline">
                {claim?.reviewStatus ?? "Review decision"}
              </h2>
              {claim?.reviewStatus ? (
                <p className="mt-3 body text-black/80">
                  Decided by {claim?.reviewedByName ?? "—"} —{" "}
                  {claim?.reviewComment || "No comment."}
                </p>
              ) : (
                <>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Reasoning for this decision (logged to audit trail)…"
                    className="mt-4 min-h-28 w-full rounded-xl border border-[#e6e6e6] bg-[#f7f7f5] px-4 py-3 body placeholder:text-black/40"
                  />
                  <div className="mt-4 flex flex-wrap gap-3">
                    {Object.entries(ACTION_STYLES).map(([k, a]) => (
                      <button
                        key={k}
                        onClick={() => handleDecision(k)}
                        disabled={submitting}
                        className={`rounded-full px-5 py-2.5 body-sm font-[540] disabled:opacity-50 ${a.cls}`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {claim?.reviewStatus === "approved" && (
                <div className="mt-5 border-t border-[#f1f1f1] pt-5">
                  {claim?.payoutStatus ? (
                    <>
                      <p className="body-sm capitalize text-black/70">
                        Payout {claim.payoutStatus.payoutId} ·{" "}
                        {claim.payoutStatus.state}
                      </p>
                      {import.meta.env.VITE_RAZORPAY_MOCK === "1" &&
                        claim.payoutStatus.state === "queued" && (
                          <button
                            onClick={handleAdvance}
                            disabled={advancing}
                            className="mt-3 rounded-full border border-black px-5 py-2.5 body-sm font-[540] text-black disabled:opacity-50"
                          >
                            {advancing ? "Simulating…" : "Simulate processing"}
                          </button>
                        )}
                    </>
                  ) : (
                    <button
                      onClick={handleDisburse}
                      disabled={disbursing}
                      className="rounded-full bg-black px-5 py-2.5 body-sm font-[540] text-white disabled:opacity-50"
                    >
                      {disbursing ? "Dispatching…" : "Disburse"}
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* History timeline */}
            <section className="rounded-3xl border border-[#e6e6e6] bg-white p-6">
              <h2 className="headline">History</h2>
              <ol className="mt-5 space-y-4">
                {history.length === 0 ? (
                  <li className="body text-black/60">No history.</li>
                ) : (
                  history.map((h) => (
                    <li key={h.id} className="flex gap-4">
                      <div className="mt-1.5 size-2.5 shrink-0 rounded-full bg-[#1f1d3d]" />
                      <div>
                        <p className="body-sm font-[540]">
                          {h.action.replace("_", " ")}
                        </p>
                        <p className="caption text-black/50">
                          {fmtTime(h.timestamp)} ·{" "}
                          {h.actorName ?? h.actorId ?? "system"}
                        </p>
                        {h.comment && (
                          <p className="mt-1 body-sm text-black/80">
                            “{h.comment}”
                          </p>
                        )}
                        {h.verdict && (
                          <span className="mt-1 inline-block rounded-full bg-[#f1f1f1] px-3 py-0.5 caption capitalize">
                            {h.verdict.replace("_", " ")}
                          </span>
                        )}
                      </div>
                    </li>
                  ))
                )}
              </ol>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ClaimDetail;
