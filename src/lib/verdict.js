const VERDICT_ALIASES = {
  approve: "approved",
  approves: "approved",
  approved: "approved",
  rejected: "rejected",
  reject: "rejected",
  denies: "rejected",
  deny: "rejected",
  flagged: "flagged",
  flag: "flagged",
  needs_human_review: "needs_human_review",
  human_review: "needs_human_review",
  review: "needs_human_review",
  cannot_decide: "needs_human_review",
};

export function normalizeVerdict(v) {
  if (typeof v !== "string") return "needs_human_review";
  return VERDICT_ALIASES[v.trim().toLowerCase()] ?? "needs_human_review";
}

export function parseVerdict(content) {
  try {
    const parsed = JSON.parse(content);
    return {
      verdict: normalizeVerdict(parsed.verdict),
      citedClauseIds: Array.isArray(parsed.citedClauseIds)
        ? parsed.citedClauseIds
        : [],
      reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "",
      confidence:
        typeof parsed.confidence === "number"
          ? Math.min(Math.max(parsed.confidence, 0), 1)
          : 0,
    };
  } catch {
    return {
      verdict: "needs_human_review",
      citedClauseIds: [],
      reasoning: "",
      confidence: 0,
    };
  }
}