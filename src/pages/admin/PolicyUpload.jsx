import {
  doc,
  addDoc,
  collection,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { useState } from "react";
import { db } from "../../firebase.js";
import { useAuth } from "../../context/useAuth.js";
import { TbUpload, TbCheck, TbX } from "react-icons/tb";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

function PolicyUpload() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [policyName, setPolicyName] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [status, setStatus] = useState(null); // "processing" | "parsed" | "failed"
  const [clauses, setClauses] = useState([]);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Don't proceed unless the user filled in all three fields
    if (!file || !policyName || !effectiveDate) return;

    setStatus("processing");
    setError("");
    setClauses([]);

    // Build a multipart upload so the backend can receive the file + metadata together
    const form = new FormData();
    form.append("file", file);
    form.append("policyName", policyName);
    form.append("effectiveFromDate", effectiveDate);

    try {
      // 1. Send the PDF to our backend to be parsed into clauses
      const res = await fetch(`${API}/api/policies/parse`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Parsing failed");
      }
      const { clauses: parsed } = await res.json();
      setClauses(parsed);

      // 2. Create the policy document in Firestore
      const policyRef = await addDoc(collection(db, "policies"), {
        name: policyName,
        effectiveFromDate: new Date(effectiveDate),
        uploadDate: serverTimestamp(),
        uploadedBy: user.uid,
        status: "parsed",
        clauseCount: parsed.length,
      });

      // 3. Write each clause as its own sub-document under this policy,
      //    using a batch so they all save in one operation.
      const batch = writeBatch(db);
      parsed.forEach((c) => {
        const ref = doc(collection(db, "policies", policyRef.id, "clauses"));
        batch.set(ref, {
          clauseId: c.clauseId,
          heading: c.heading,
          pageNumber: c.pageNumber,
          text: c.text,
          policyId: policyRef.id,
          effectiveDate: new Date(effectiveDate),
        });
      });
      await batch.commit();

      setStatus("parsed");
    } catch (err) {
      setStatus("failed");
      setError(err.message);
    }
  };

  return (
    <main className="bg-[#f7f7f5] text-black">
      <div className="mx-auto max-w-6xl px-8 py-16 md:px-12">
        <h1 className="eyebrow">Policy Upload</h1>
        <p className="mt-3 body">
          Upload a policy PDF — it&apos;s parsed into numbered clauses.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 grid gap-8 rounded-3xl border border-[#e6e6e6] bg-white p-8 lg:grid-cols-[1fr_320px]"
        >
          <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#e6e6e6] bg-[#f7f7f5] p-8 text-center">
            <TbUpload className="size-8 text-black/50" />
            <span className="body">
              {file ? file.name : "Drop a policy PDF here"}
            </span>
            <span className="caption">PDF only</span>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0] || null)}
            />
          </label>

          <div className="flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className="body-sm font-[480]">Policy name</span>
              <input
                value={policyName}
                onChange={(e) => setPolicyName(e.target.value)}
                placeholder="e.g. Travel & Expense Policy v2"
                className="rounded-lg border border-[#e6e6e6] bg-white px-3.5 py-3 body placeholder:text-black/40"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="body-sm font-[480]">Effective from</span>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="rounded-lg border border-[#e6e6e6] bg-white px-3.5 py-3 body"
              />
            </label>
            <button
              type="submit"
              disabled={status === "processing"}
              className="mt-auto rounded-[50px] bg-black px-6 py-3 text-[20px] font-[480] text-white disabled:opacity-50"
            >
              {status === "processing" ? "Processing…" : "Upload & parse"}
            </button>
          </div>
        </form>

        {status === "parsed" && (
          <div className="mt-8 flex items-center gap-2 text-green-700">
            <TbCheck className="size-6" />
            <span className="body">
              Parsed {clauses.length} clauses successfully.
            </span>
          </div>
        )}
        {status === "failed" && (
          <div className="mt-8 flex items-center gap-2 text-[#ff3d8b]">
            <TbX className="size-6" />
            <span className="body">{error}</span>
          </div>
        )}

        {clauses.length > 0 && (
          <div className="mt-10">
            <h2 className="headline">Clause preview</h2>
            <div className="mt-6 max-h-120 space-y-4 overflow-y-auto pr-2">
              {clauses.map((c, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[#e6e6e6] bg-white p-6"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="caption rounded-full bg-[#1f1d3d] px-3 py-1 text-white">
                      {c.clauseId}
                    </span>
                    <span className="body-sm font-[540]">{c.heading}</span>
                    <span className="caption text-black/40">
                      p.{c.pageNumber}
                    </span>
                  </div>
                  <p className="mt-3 body text-black/80">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default PolicyUpload;
