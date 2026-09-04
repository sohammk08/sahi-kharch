// Pure helpers for the review dashboard. Kept side-effect free so they're
// trivially testable without Firestore.

// A claim needs human review when the auto-verdict is inconclusive and a
// human hasn't already decided on it.
export function isNeedsReview(claim) {
  return claim?.verdict === "needs_human_review" && !claim?.reviewStatus;
}

// Summary cards: totals + percentages over a list of claims.
// auto-resolved = system made a clear call (approved or rejected).
export function summarizeClaims(claims) {
  const total = claims.length;
  if (total === 0)
    return { total: 0, autoResolved: 0, flagged: 0, needsReview: 0 };

  const autoResolved = claims.filter(
    (c) => c.verdict === "approved" || c.verdict === "rejected",
  ).length;
  const flagged = claims.filter((c) => c.verdict === "flagged").length;
  const needsReview = claims.filter(isNeedsReview).length;

  const pct = (n) => Math.round((n / total) * 100);
  return {
    total,
    autoResolved: pct(autoResolved),
    flagged: pct(flagged),
    needsReview: pct(needsReview),
  };
}
