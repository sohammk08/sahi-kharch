import { db } from "../../firebase.js";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { batchRun } from "../../lib/pipeline.js";
import { useAuth } from "../../context/useAuth.js";
import { friendlyError } from "../../lib/errors.js";
import { collection, getDocs } from "firebase/firestore";

function fmtDate(v) {
  if (!v) return "—";
  if (typeof v === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(v)) return v;
  const d = v?.toDate ? v.toDate() : new Date(v);
  return isNaN(d) ? "—" : d.toISOString().slice(0, 10);
}

const receiptLabel = (r) => {
  const e = r.extracted ?? {};
  const amt = typeof e.amount === "number" ? `₹${e.amount}` : "?";
  return `${e.vendor || "Unknown vendor"} — ${amt} (${e.date || "no date"})`;
};

function BatchRun() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [selectedReceipts, setSelectedReceipts] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [policyId, setPolicyId] = useState("");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // Fetches receipts, policies, and employee-filtered users on mount and updates loading state
  useEffect(() => {
    Promise.all([
      getDocs(collection(db, "receipts")),
      getDocs(collection(db, "users")),
      getDocs(collection(db, "policies")),
    ])
      .then(([r, u, p]) => {
        setReceipts(r.docs.map((d) => ({ id: d.id, ...d.data() })));
        setEmployees(
          u.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((x) => x.role === "employee"),
        );
        setPolicies(p.docs.map((d) => ({ id: d.id, ...d.data() })));
      })
      .finally(() => setLoadingData(false));
  }, []);

  const toggleReceipt = (id) =>
    setSelectedReceipts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const canRun =
    selectedReceipts.length > 0 && employeeId && policyId && !running;

  // Run AI verdicts on all selected receipts, then jump to the dashboard filtered to this batch
  const handleRun = async () => {
    setRunning(true);
    setError("");
    setDone(0);
    setMsg("");
    try {
      const items = selectedReceipts.map((receiptId) => ({
        receiptId,
        employeeId,
        policyId,
      }));
      const batchId = await batchRun({
        items,
        actorId: user.uid,
        actorName: profile?.name ?? user.email,
        onProgress: (d, total, m) => {
          setDone(d);
          setMsg(m);
        },
      });
      navigate(`/admin/dashboard?batch=${batchId}`);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className="bg-[#f7f7f5] text-black">
      <div className="mx-auto max-w-6xl px-8 py-16 md:px-12">
        <h1 className="eyebrow">Batch Run</h1>
        <p className="mt-3 body">
          Run the decision pipeline over many receipts at once, then jump to the
          dashboard filtered to this batch.
        </p>

        <div className="mt-10 rounded-3xl border border-[#e6e6e6] bg-white p-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <p className="body-sm font-[480]">
                Receipts ({selectedReceipts.length})
              </p>
              <div className="mt-3 max-h-64 space-y-1 overflow-y-auto pr-1">
                {loadingData ? (
                  <p className="body-sm text-black/50">Loading…</p>
                ) : receipts.length === 0 ? (
                  <p className="body-sm text-black/50">
                    Upload receipts first in Receipt Tester.
                  </p>
                ) : (
                  receipts.map((r) => (
                    <label
                      key={r.id}
                      className="flex items-center gap-3 rounded-lg border border-[#e6e6e6] px-3 py-2 body-sm hover:bg-[#f7f7f5]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedReceipts.includes(r.id)}
                        onChange={() => toggleReceipt(r.id)}
                        className="size-4"
                      />
                      <span className="truncate">{receiptLabel(r)}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

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
              {!loadingData && employees.length === 0 && (
                <span className="caption text-black/50">
                  No employees yet — create accounts in People.
                </span>
              )}
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
            {running
              ? `Running ${done}/${selectedReceipts.length}…`
              : "Run Batch"}
          </button>
          {error && <p className="mt-4 body text-[#ff3d8b]">{error}</p>}

          {running && selectedReceipts.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between body-sm text-black/60">
                <span>{msg || "Starting…"}</span>
                <span>
                  {Math.round((done / selectedReceipts.length) * 100)}%
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/10">
                <div
                  className="h-full bg-black transition-[width] duration-300"
                  style={{
                    width: `${(done / selectedReceipts.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default BatchRun;
