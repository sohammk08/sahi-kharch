import { test } from "node:test";
import assert from "node:assert/strict";
import { friendlyError } from "./errors.js";
import { runRules } from "./rulesEngine.js";
import { computeRiskScore } from "./riskScore.js";

test("runRules flags over-limit meals as critical", () => {
  const r = runRules(
    {
      id: "a",
      extracted: {
        vendor: "Taj",
        amount: 3000,
        date: "15/01/2026",
        category: "meals",
      },
    },
    { effectiveFromDate: new Date("2025-01-01") },
    [],
  );
  assert.equal(r.passed, false);
  assert.equal(r.severity, "critical");
  assert.ok(r.violations.some((v) => v.rule === "category_limit"));
});

test("runRules flags missing required fields", () => {
  const r = runRules(
    { id: "a", extracted: { amount: 100, category: "meals" } },
    { effectiveFromDate: new Date("2025-01-01") },
    [],
  );
  assert.ok(
    r.violations.some(
      (v) => v.rule === "required_field" && v.detail.includes("vendor"),
    ),
  );
});

test("runRules detects duplicate receipt", () => {
  const r = runRules(
    {
      id: "b",
      extracted: {
        vendor: "X",
        amount: 500,
        date: "01/01/2026",
        category: "meals",
      },
    },
    { effectiveFromDate: new Date("2025-01-01") },
    [{ id: "c", extracted: { vendor: "X", amount: 500, date: "01/01/2026" } }],
  );
  assert.ok(r.violations.some((v) => v.rule === "duplicate"));
});

test("runRules flags pre-effective-date receipt", () => {
  const r = runRules(
    {
      id: "a",
      extracted: {
        vendor: "X",
        amount: 100,
        date: "01/01/2024",
        category: "meals",
      },
    },
    { effectiveFromDate: new Date("2025-01-01") },
    [],
  );
  assert.ok(r.violations.some((v) => v.rule === "date_validity"));
});

test("computeRiskScore inverts confidence and weights severity", () => {
  const s = computeRiskScore({
    rulesOutput: {
      severity: "critical",
      violations: [{ rule: "x", severity: "critical" }],
    },
    receipt: { confidence: { vendor: 0.9, amount: 0.9 } },
    anomalySignals: 0,
    llm: { confidence: 0.5 },
  });
  // 100*0.4 + (1-0.9)*100*0.3 + 0*0.2 + (1-0.5)*100*0.1 = 40 + 3 + 0 + 5 = 48
  assert.equal(s.overall, 48);
  assert.equal(s.violationSeverity, 100);
});

test("friendlyError maps the 30s STT limit to a short message", () => {
  const err = new Error(
    'Sarvam stt failed: 400 {"error":{"message":"Audio duration exceeds the maximum limit of 30 seconds. Please use the batch API for longer audio files."}}',
  );
  const out = friendlyError(err);
  assert.match(out, /30 seconds/i);
  assert.ok(!out.includes("Sarvam"));
});

test("friendlyError maps network failures to a reachability message", () => {
  const out = friendlyError(new Error("Failed to fetch"));
  assert.match(out, /can't reach the server/i);
});

test("friendlyError returns the generic fallback for unknown errors", () => {
  const out = friendlyError(new Error("some raw internal detail"));
  assert.equal(out, "Something went wrong. Please try again.");
});
