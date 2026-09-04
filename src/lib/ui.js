export const VERDICT_STYLES = {
  approved: { label: "Approved", cls: "bg-[#dceeb1] text-black" },
  flagged: { label: "Flagged", cls: "bg-[#f4ecd6] text-black" },
  rejected: { label: "Rejected", cls: "bg-[#efd4d4] text-black" },
  needs_human_review: {
    label: "Needs Human Review",
    cls: "bg-[#d3e3f5] text-black",
  },
};

export const fmtDate = (v) => {
  if (!v) return "—";
  if (typeof v === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(v)) return v;
  const d = v?.toDate ? v.toDate() : new Date(v);
  return isNaN(d) ? "—" : d.toISOString().slice(0, 10);
};

export const fmtTime = (v) => {
  const d = v?.toDate ? v.toDate() : new Date(v);
  return isNaN(d) ? "—" : d.toLocaleString();
};

export const receiptLabel = (r) => {
  const e = r.extracted ?? {};
  const amt = typeof e.amount === "number" ? `₹${e.amount}` : "?";
  return `${e.vendor || "Unknown vendor"} — ${amt} (${e.date || "no date"})`;
};