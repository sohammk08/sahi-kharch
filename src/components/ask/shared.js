export const VERDICT_STYLES = {
  approved: { label: "Approved", cls: "bg-[#dceeb1] text-black" },
  flagged: { label: "Flagged", cls: "bg-[#f4ecd6] text-black" },
  rejected: { label: "Rejected", cls: "bg-[#efd4d4] text-black" },
  needs_human_review: {
    label: "Needs Human Review",
    cls: "bg-[#d3e3f5] text-black",
  },
};

// Localized UI labels; clause text stays in the policy's original language.
const LABELS = {
  why: {
    "en-IN": "Why?",
    "hi-IN": "क्यों?",
    "mr-IN": "का?",
    "te-IN": "ఎందుకు?",
    "kn-IN": "ಏಕೆ?",
  },
  page: {
    "en-IN": "Page",
    "hi-IN": "पृष्ठ",
    "mr-IN": "पृष्ठ",
    "te-IN": "పేజీ",
    "kn-IN": "ಪುಟ",
  },
  listen: {
    "en-IN": "Listen",
    "hi-IN": "सुनें",
    "mr-IN": "ऐका",
    "te-IN": "వినండి",
    "kn-IN": "ಕೇಳಿ",
  },
};
export const label = (key, lang) => LABELS[key][lang] ?? LABELS[key]["en-IN"];

export const selectorCls =
  "w-full rounded-lg border border-[#e6e6e6] bg-white px-3.5 py-3 body-sm";
export const chipCls =
  "caption rounded-full border border-[#e6e6e6] bg-white px-3 py-2";
export const chipActiveCls =
  "caption rounded-full bg-[#1f1d3d] px-3 py-2 text-white";

// Date formatter
export const fmtDate = (v) => {
  if (!v) return "—";
  if (typeof v === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(v)) return v;
  const d = v?.toDate ? v.toDate() : new Date(v);
  return isNaN(d) ? "—" : d.toISOString().slice(0, 10);
};
