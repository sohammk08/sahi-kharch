import { db } from "../../firebase.js";
import { useState, useEffect } from "react";
import { FaArrowRight, FaXmark } from "react-icons/fa6";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

const VERDICT_STYLES = {
  approved: "bg-[#dceeb1] text-black",
  flagged: "bg-[#f4ecd6] text-black",
  rejected: "bg-[#efd4d4] text-black",
  needs_human_review: "bg-[#d3e3f5] text-black",
};
const FILTERS = [
  "all",
  "approved",
  "flagged",
  "rejected",
  "needs_human_review",
];

// Time formatter
function fmtTime(v) {
  const d = v?.toDate ? v.toDate() : new Date(v);
  return isNaN(d) ? "—" : d.toLocaleString();
}

function AuditLog() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [bundle, setBundle] = useState(null);
  const [bundleLoading, setBundleLoading] = useState(false);

  // Load the audit log once on mount
  useEffect(() => {
    getDocs(collection(db, "audit_log"))
      .then((snap) =>
        setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      )
      .finally(() => setLoading(false));
  }, []);

  Open a bundle when a row's arrow is clicked
  const openBundle = async (entry) => {
    setSelected(entry);
    setBundle(null);
    if (!entry.evidenceBundleId) return;
    setBundleLoading(true);
    try {
      const snap = await getDoc(
        doc(db, "evidence_bundles", entry.evidenceBundleId),
      );
      setBundle(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    } finally {
      setBundleLoading(false);
    }
  };

  const shown =
    filter === "all" ? entries : entries.filter((e) => e.verdict === filter);

  return (
    <main className="bg-[#f7f7f5] text-black">
      <div className="mx-auto max-w-6xl px-8 py-16 md:px-12">
        <h1 className="eyebrow">Audit Log</h1>
        <p className="mt-3 body">Every verdict run, append-only.</p>

        <div className="mt-8 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`caption rounded-full px-4 py-2 capitalize ${
                filter === f
                  ? "bg-[#1f1d3d] text-white"
                  : "bg-white border border-[#e6e6e6]"
              }`}
            >
              {f.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="mt-6 overflow-x-auto rounded-3xl border border-[#e6e6e6] bg-white">
          {loading ? (
            <p className="p-8 body">Loading…</p>
          ) : shown.length === 0 ? (
            <p className="p-8 body">No audit entries.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="caption border-b border-[#e6e6e6] text-black/50">
                  <th className="px-6 py-4">Claim ID</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Verdict</th>
                  <th className="px-6 py-4">Risk Score</th>
                  <th className="px-6 py-4">Cited Clauses</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-[#f1f1f1] last:border-0"
                  >
                    <td className="px-6 py-4 body-sm font-mono text-[13px]">
                      {e.claimId}
                    </td>
                    <td className="px-6 py-4 body-sm">
                      {fmtTime(e.timestamp)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`caption rounded-full px-3 py-1 capitalize ${VERDICT_STYLES[e.verdict] ?? "bg-[#f1f1f1]"}`}
                      >
                        {e.verdict?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 body-sm">{e.riskScore ?? "—"}</td>
                    <td className="px-6 py-4 body-sm">
                      {e.citedClauseIds?.join(", ") || "—"}
                    </td>
                    <td className="px-6 py-4 body-sm">
                      {e.actorName ?? e.actorId ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openBundle(e)}
                        aria-label="View evidence bundle"
                        className="flex size-9 items-center justify-center rounded-full hover:bg-[#f7f7f5]"
                      >
                        <FaArrowRight className="size-4 -rotate-45" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div
        onClick={() => setSelected(null)}
        className={`fixed inset-0 z-50 bg-black/30 transition-opacity duration-300 ${
          selected ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        className={`fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-white transition-transform duration-300 sm:w-2/3 lg:w-1/2 ${
          selected ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selected && (
          <>
            <div className="flex items-start justify-between border-b border-[#e6e6e6] px-8 py-6">
              <div>
                <p className="eyebrow">Evidence Bundle</p>
                <h2 className="mt-1 headline font-mono text-[18px]">
                  Claim {selected.claimId}
                </h2>
                <p className="mt-1 body-sm text-black/50">
                  {selected.verdict?.replace("_", " ")} · risk{" "}
                  {selected.riskScore ?? "—"} · {fmtTime(selected.timestamp)}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="flex size-9 items-center justify-center rounded-full hover:bg-[#f7f7f5]"
              >
                <FaXmark className="size-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-8 pt-6">
              {bundleLoading ? (
                <p className="body">Loading bundle…</p>
              ) : !bundle ? (
                <p className="body text-black/60">
                  No evidence bundle found for this entry.
                </p>
              ) : (
                <div className="space-y-8">
                  <section>
                    <h3 className="caption text-black/50">Receipt data</h3>
                    <pre className="mt-3 overflow-auto rounded-xl bg-[#f7f7f5] p-4 font-mono text-[13px]">
                      {JSON.stringify(bundle.receiptData, null, 2)}
                    </pre>
                  </section>

                  <section>
                    <h3 className="caption text-black/50">Retrieved clauses</h3>
                    <div className="mt-3 space-y-3">
                      {(bundle.retrievedClauses ?? []).map((c, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-[#e6e6e6] p-4"
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
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="caption text-black/50">
                      Rules engine output
                    </h3>
                    <pre className="mt-3 overflow-auto rounded-xl bg-[#f7f7f5] p-4 font-mono text-[13px]">
                      {JSON.stringify(bundle.rulesEngineOutput, null, 2)}
                    </pre>
                  </section>

                  <section>
                    <h3 className="caption text-black/50">Risk breakdown</h3>
                    <pre className="mt-3 overflow-auto rounded-xl bg-[#f7f7f5] p-4 font-mono text-[13px]">
                      {JSON.stringify(bundle.riskScore, null, 2)}
                    </pre>
                  </section>

                  <section>
                    <h3 className="caption text-black/50">LLM output</h3>
                    <pre className="mt-3 overflow-auto rounded-xl bg-[#f7f7f5] p-4 font-mono text-[13px]">
                      {JSON.stringify(bundle.llmOutput, null, 2)}
                    </pre>
                  </section>

                  <section>
                    <h3 className="caption text-black/50">
                      LLM input (prompt)
                    </h3>
                    <div className="mt-3 space-y-3">
                      <pre className="overflow-auto rounded-xl bg-[#f7f7f5] p-4 font-mono text-[13px]">
                        {bundle.llmInput?.system ?? "—"}
                      </pre>
                      <pre className="overflow-auto rounded-xl bg-[#f7f7f5] p-4 font-mono text-[13px]">
                        {bundle.llmInput?.user ?? "—"}
                      </pre>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </main>
  );
}

export default AuditLog;
