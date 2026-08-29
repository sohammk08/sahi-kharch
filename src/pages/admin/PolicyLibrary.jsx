import { db } from "../../firebase.js";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";

function PolicyLibrary() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Set up a real-time listener for policies and sort them by upload date
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "policies"), (snap) => {
      setPolicies(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort(
            (a, b) =>
              (a.uploadDate?.seconds || 0) - (b.uploadDate?.seconds || 0),
          ),
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  const fmtDate = (d) =>
    d instanceof Date
      ? d.toISOString().slice(0, 10)
      : (d?.toDate?.()?.toISOString?.().slice(0, 10) ?? "—");

  return (
    <main className="bg-[#f7f7f5] text-black">
      <div className="mx-auto max-w-6xl px-8 py-16 md:px-12">
        <h1 className="eyebrow">Policy Library</h1>
        <p className="mt-3 body">All uploaded policy versions.</p>

        <div className="mt-10 overflow-x-auto rounded-3xl border border-[#e6e6e6] bg-white">
          {loading ? (
            <p className="p-8 body">Loading…</p>
          ) : policies.length === 0 ? (
            <p className="p-8 body">No policies uploaded yet.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="caption border-b border-[#e6e6e6] text-black/50">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Effective</th>
                  <th className="px-6 py-4">Clauses</th>
                  <th className="px-6 py-4">Uploaded</th>
                  <th className="px-6 py-4">Status</th>
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

export default PolicyLibrary;
