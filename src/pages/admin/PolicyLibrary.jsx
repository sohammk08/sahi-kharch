import { db } from "../../firebase.js";
import { fmtDate } from "../../lib/ui.js";
import { useEffect, useState } from "react";
import { FaArrowRight, FaXmark } from "react-icons/fa6";
import { collection, onSnapshot } from "firebase/firestore";

function PolicyLibrary() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [clauses, setClauses] = useState([]);

  // Listen for real-time updates to the clauses of the selected policy
  useEffect(() => {
    if (!selected?.id) return;
    const unsub = onSnapshot(
      collection(db, "policies", selected.id, "clauses"),
      (snap) =>
        setClauses(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.pageNumber ?? 0) - (b.pageNumber ?? 0)),
        ),
    );
    return unsub;
  }, [selected?.id]);

  // Set up a real-time listener for policies and sort by effective date
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "policies"), (snap) => {
      setPolicies(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort(
            (a, b) =>
              (a.effectiveFromDate?.toMillis?.() ?? 0) -
              (b.effectiveFromDate?.toMillis?.() ?? 0),
          ),
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <section>
      <div>
        <h2 className="headline">Versions</h2>
        <p className="mt-1 body-sm text-black/60">
          All uploaded policy versions.
        </p>

        <div className="mt-6 overflow-x-auto rounded-3xl border border-[#e6e6e6] bg-white">
          {loading ? (
            <p className="p-8 body">Loading…</p>
          ) : policies.length === 0 ? (
            <p className="p-8 body">No policies uploaded yet.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="caption border-b border-[#e6e6e6] text-black/50">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Effective range</th>
                  <th className="px-6 py-4">Clauses</th>
                  <th className="px-6 py-4">Uploaded</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {policies.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[#f1f1f1] last:border-0"
                  >
                    <td className="px-6 py-4 body-sm font-[480]">{p.name}</td>
                    <td className="px-6 py-4 body-sm">
                      {fmtDate(p.effectiveFromDate)}
                      {p.effectiveToDate
                        ? ` → ${fmtDate(p.effectiveToDate)}`
                        : " → present"}
                    </td>
                    <td className="px-6 py-4 body-sm">
                      {p.clauseCount ?? "—"}
                    </td>
                    <td className="px-6 py-4 body-sm">
                      {fmtDate(p.uploadDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`caption rounded-full px-3 py-1 ${
                          p.status === "parsed"
                            ? "bg-[#dceeb1] text-black"
                            : p.status === "processing"
                              ? "bg-[#f4ecd6] text-black"
                              : "bg-[#efd4d4] text-black"
                        }`}
                      >
                        {p.status === "parsed"
                          ? "Active"
                          : p.status === "processing"
                            ? "Processing"
                            : "Failed"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelected(p)}
                        aria-label={`View ${p.name}`}
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
        className={`fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-white transition-transform duration-300 sm:w-1/3 ${
          selected ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selected && (
          <>
            <div className="flex items-start justify-between border-b border-[#e6e6e6] px-8 py-6">
              <div>
                <p className="eyebrow">Policy</p>
                <h2 className="mt-1 headline">{selected.name}</h2>
                <span
                  className={`caption mt-2 inline-block rounded-full px-3 py-1 ${
                    selected.status === "parsed"
                      ? "bg-[#dceeb1]"
                      : selected.status === "processing"
                        ? "bg-[#f4ecd6]"
                        : "bg-[#efd4d4]"
                  }`}
                >
                  {selected.status === "parsed"
                    ? "Active"
                    : selected.status === "processing"
                      ? "Processing"
                      : "Failed"}
                </span>
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
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <dt className="caption text-black/50">Effective</dt>
                  <dd className="body-sm">
                    {fmtDate(selected.effectiveFromDate)}
                  </dd>
                </div>
                <div>
                  <dt className="caption text-black/50">Uploaded</dt>
                  <dd className="body-sm">{fmtDate(selected.uploadDate)}</dd>
                </div>
                <div>
                  <dt className="caption text-black/50">Clauses</dt>
                  <dd className="body-sm">{selected.clauseCount ?? "—"}</dd>
                </div>
                <div>
                  <dt className="caption text-black/50">Uploaded by</dt>
                  <dd className="body-sm break-all">
                    {selected.uploadedBy ?? "—"}
                  </dd>
                </div>
              </dl>

              <h3 className="mt-8 caption text-black/50">Clauses</h3>
              {clauses.length === 0 ? (
                <p className="mt-3 body text-black/60">No clauses yet.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {clauses.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-[#e6e6e6] p-5"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="caption rounded-full bg-[#1f1d3d] px-3 py-1 text-white">
                          {c.clauseId}
                        </span>
                        <span className="body-sm font-[540]">{c.heading}</span>
                        {c.pageNumber != null && (
                          <span className="caption text-black/40">
                            p.{c.pageNumber}
                          </span>
                        )}
                      </div>
                      <p className="mt-3 body text-black/80">{c.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </section>
  );
}

export default PolicyLibrary;
