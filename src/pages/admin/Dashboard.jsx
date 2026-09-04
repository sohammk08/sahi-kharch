import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase.js";
import { isNeedsReview, summarizeClaims } from "../../lib/review.js";

const VERDICT_STYLES = {
  approved: "bg-[#dceeb1] text-black",
  flagged: "bg-[#f4ecd6] text-black",
  rejected: "bg-[#efd4d4] text-black",
  needs_human_review: "bg-[#d3e3f5] text-black",
};

function fmtDate(v) {
  if (!v) return "—";
  const d = v?.toDate ? v.toDate() : new Date(v);
  return isNaN(d) ? "—" : d.toISOString().slice(0, 10);
}

const CARDS = [
  { key: "total", label: "Total claims", suffix: "" },
  { key: "autoResolved", label: "% auto-resolved", suffix: "%" },
  { key: "flagged", label: "% flagged", suffix: "%" },
  { key: "needsReview", label: "% needs review", suffix: "%" },
];

function Dashboard() {
  const [params] = useSearchParams();
  const batchId = params.get("batch");
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(collection(db, "claims"))
      .then((snap) =>
        setClaims(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort(
              (a, b) => (b.riskScore?.overall ?? 0) - (a.riskScore?.overall ?? 0),
            ),
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const scoped = batchId ? claims.filter((c) => c.batchId === batchId) : claims;
  const summary = summarizeClaims(scoped);
  const queue = scoped.filter(isNeedsReview);

  return (
    <main className="bg-[#f7f7f5] text-black">
      <div className="mx-auto max-w-6xl px-8 py-16 md:px-12">
        <h1 className="eyebrow">Dashboard</h1>
        <p className="mt-3 body">
          {batchId
            ? `Results for batch ${batchId.slice(0, 8)}.`
            : "Claim volume and exceptions needing attention."}
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((c) => (
            <div
              key={c.key}
              className="rounded-3xl border border-[#e6e6e6] bg-white p-6"
            >
              <p className="caption text-black/50">{c.label}</p>
              <p className="mt-2 headline">
                {summary[c.key]}
                {c.suffix}
              </p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 headline">Needs Human Review</h2>
        <div className="mt-4 overflow-x-auto rounded-3xl border border-[#e6e6e6] bg-white">
          {loading ? (
            <p className="p-8 body">Loading…</p>
          ) : queue.length === 0 ? (
            <p className="p-8 body">
              No claims need review right now. {scoped.length > 0 ? "All clear." : "Run a batch to populate claims."}
            </p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="caption border-b border-[#e6e6e6] text-black/50">
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Risk</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-[#f1f1f1] last:border-0 hover:bg-[#f7f7f5]"
                  >
                    <td className="px-6 py-4 body-sm font-[480]">
                      <Link to={`/admin/claim/${c.id}`} className="underline">
                        {c.employeeName ?? "—"}
                      </Link>
                    </td>
                    <td className="px-6 py-4 body-sm">
                      {typeof c.amount === "number"
                        ? `₹${c.amount.toLocaleString("en-IN")}`
                        : "—"}
                    </td>
                    <td className="px-6 py-4 body-sm capitalize">
                      {c.category ?? "—"}
                    </td>
                    <td className="px-6 py-4 body-sm">
                      {c.riskScore?.overall ?? "—"}
                    </td>
                    <td className="px-6 py-4 body-sm">
                      {fmtDate(c.receiptDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`caption rounded-full px-3 py-1 ${VERDICT_STYLES[c.verdict] ?? "bg-[#f1f1f1]"}`}
                      >
                        {c.verdict?.replace("_", " ") ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}

export default Dashboard;
