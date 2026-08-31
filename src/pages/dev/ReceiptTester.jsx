import { useState } from "react";
import { db } from "../../firebase.js";
import { TbUpload } from "react-icons/tb";
import { useAuth } from "../../context/useAuth.js";
import { friendlyError } from "../../lib/errors.js";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const FIELDS = ["vendor", "date", "amount", "currency", "taxOrGST", "category"];
const LABELS = {
  vendor: "Vendor",
  date: "Date",
  amount: "Amount",
  currency: "Currency",
  taxOrGST: "Tax / GST",
  category: "Category",
};

// Turn a confidence score into a colored badge
function confidenceBadge(value) {
  if (value === "not_found")
    return { label: "Not found — Flag", cls: "bg-[#efd4d4] text-black" };
  if (value >= 0.8)
    return { label: "High confidence", cls: "bg-[#dceeb1] text-black" };
  if (value >= 0.5)
    return { label: "Medium confidence", cls: "bg-[#f4ecd6] text-black" };
  return { label: "Low confidence", cls: "bg-[#f3c9b6] text-black" };
}

function ReceiptTester() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Runs when a file is selected: store it, reset old results/errors,
  // and make a preview URL for it (object URL = in-memory, freed by the browser).
  const handleFile = (e) => {
    const f = e.target.files[0] || null;
    setFile(f);
    setResult(null);
    setError("");
    if (f) setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setProcessing(true);
    setError("");
    setResult(null);

    const form = new FormData();
    form.append("file", file);

    try {
      // 1. Send the file to the backend, which runs Sarvam extraction.
      const res = await fetch(`${API}/api/receipts/parse`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Extraction failed");
      }
      const { extracted, confidence } = await res.json();
      setResult({ extracted, confidence });

      // 2. Save the result to Firestore as a new "receipts" document
      await addDoc(collection(db, "receipts"), {
        uploadedBy: user.uid,
        uploadDate: serverTimestamp(),
        fileUrl: "",
        extracted,
        confidence,
        status: "parsed",
      });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="bg-[#f7f7f5] text-black">
      <div className="mx-auto max-w-6xl px-8 py-16 md:px-12">
        <h1 className="eyebrow">Receipt Tester</h1>
        <p className="mt-3 body">
          Internal debug tool — upload a receipt, inspect extracted fields and
          confidence.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 rounded-3xl border border-[#e6e6e6] bg-white p-8"
        >
          <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#e6e6e6] bg-[#f7f7f5] p-8 text-center">
            <TbUpload className="size-8 text-black/50" />
            <span className="body">
              {file ? file.name : "Drop a receipt image or PDF here"}
            </span>
            <span className="caption">JPEG / PNG / PDF</span>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFile}
            />
          </label>
          <button
            type="submit"
            disabled={!file || processing}
            className="mt-6 rounded-[50px] bg-black px-6 py-3 text-[20px] font-[480] text-white disabled:opacity-50"
          >
            {processing ? "Extracting…" : "Extract fields"}
          </button>
        </form>

        {error && <p className="mt-6 body text-[#ff3d8b]">{error}</p>}

        {result && (
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            {preview && (
              <div className="rounded-3xl border border-[#e6e6e6] bg-white p-6">
                <h2 className="headline">Source</h2>
                <img
                  src={preview}
                  alt="Receipt"
                  className="mt-4 max-h-120 w-auto rounded-xl border border-[#e6e6e6]"
                />
              </div>
            )}
            <div className="rounded-3xl border border-[#e6e6e6] bg-white p-6">
              <h2 className="headline">Extracted fields</h2>
              <ul className="mt-4 space-y-3">
                {FIELDS.map((f) => {
                  const value = result.extracted[f];
                  const badge = confidenceBadge(result.confidence[f]);
                  return (
                    <li
                      key={f}
                      className="flex items-center justify-between gap-4 rounded-xl border border-[#f1f1f1] bg-[#f7f7f5] px-4 py-3"
                    >
                      <div>
                        <div className="caption text-black/50">{LABELS[f]}</div>
                        <div className="body font-[480]">
                          {f === "amount" && typeof value === "number"
                            ? `₹${value.toLocaleString("en-IN")}`
                            : String(value)}
                        </div>
                      </div>
                      <span
                        className={`caption whitespace-nowrap rounded-full px-3 py-1 ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default ReceiptTester;
