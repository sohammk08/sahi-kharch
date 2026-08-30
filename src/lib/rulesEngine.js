// Deterministic, no-LLM rules that run before retrieval/judgment.
// Pure function. Hardcoded caps for now; can move to Firestore later.

export const CATEGORY_LIMITS = {
  meals: 2000,
  fuel: 5000,
  hotel: 5000,
  travel: 20000,
};

const RANK = { none: 0, minor: 1, major: 2, critical: 3 };
const rankOf = (s) => RANK[s] ?? 0;

// receipt: { id, extracted: { vendor, amount, date, category }, confidence }
// policy:  { id, effectiveFromDate }
// otherReceipts: [receipt] used for duplicate detection (excludes this receipt)
export function runRules(receipt, policy, otherReceipts = []) {
  const violations = [];
  const ext = receipt?.extracted ?? {};

  for (const field of ["vendor", "amount", "date"]) {
    if (ext[field] == null || ext[field] === "not_found") {
      violations.push({
        rule: "required_field",
        detail: `Missing required field: ${field}`,
        severity: "major",
      });
    }
  }

  const limit = CATEGORY_LIMITS[ext.category];
  if (limit && typeof ext.amount === "number" && ext.amount > limit) {
    violations.push({
      rule: "category_limit",
      detail: `${ext.category} amount ₹${ext.amount} exceeds cap ₹${limit}`,
      severity: "critical",
    });
  }

  // Receipt date (DD/MM/YYYY) must fall within the policy effective window.
  const date = ext.date;
  if (date && date !== "not_found") {
    const [d, m, y] = String(date).split("/").map(Number);
    const receiptDate = new Date(y, m - 1, d);
    const eff = policy?.effectiveFromDate;
    const effective = eff?.toDate ? eff.toDate() : new Date(eff);
    if (!isNaN(receiptDate) && !isNaN(effective) && receiptDate < effective) {
      violations.push({
        rule: "date_validity",
        detail: "Receipt date is before the policy effective date",
        severity: "major",
      });
    }
  }

  const duplicate = otherReceipts.some(
    (r) =>
      r.id !== receipt?.id &&
      r.extracted?.vendor === ext.vendor &&
      r.extracted?.amount === ext.amount &&
      r.extracted?.date === ext.date,
  );
  if (duplicate) {
    violations.push({
      rule: "duplicate",
      detail: "Duplicate receipt (same vendor + amount + date)",
      severity: "critical",
    });
  }

  const severity = violations.reduce(
    (worst, v) => (rankOf(v.severity) > rankOf(worst) ? v.severity : worst),
    "none",
  );

  return { passed: violations.length === 0, violations, severity };
}
