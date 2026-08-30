import { test } from "node:test";
import assert from "node:assert/strict";
import { chunkClauses } from "./policyParser.js";

test("chunkClauses splits numbered headings across pages", () => {
  const text = "1  Purpose\nIntro text.\f2  Eligibility\nWho qualifies.\n2.1  Employees\nStaff.\f3  Limits\nAmounts.";
  const clauses = chunkClauses(text);
  assert.equal(clauses.length, 4);
  assert.deepEqual(clauses[0], {
    clauseId: "1",
    heading: "Purpose",
    pageNumber: 1,
    text: "Intro text.",
  });
  assert.equal(clauses[1].clauseId, "2");
  assert.equal(clauses[1].pageNumber, 2);
  assert.equal(clauses[2].clauseId, "2.1");
  assert.equal(clauses[2].pageNumber, 2);
  assert.equal(clauses[3].clauseId, "3");
  assert.equal(clauses[3].pageNumber, 3);
});

test("chunkClauses handles trailing-period, glued, and bare-number headings", () => {
  const text =
    "4.2Meals and Incidentals\nPer diem covers meals.\n" +
    "5. Daily Commute Policy (Home to Office)\nCommute is personal.\n" +
    "6\nNon-Reimbursable Expenses\nPersonal grooming is excluded.\n" +
    "1. Submission: Employee uploads bills.\n2. Verification: Finance checks.\n";
  const clauses = chunkClauses(text);
  const ids = clauses.map((c) => c.clauseId);
  assert.deepEqual(ids, ["4.2", "5", "6"]);
  assert.equal(clauses[0].heading, "Meals and Incidentals");
  assert.equal(clauses[1].heading, "Daily Commute Policy (Home to Office)");
  assert.equal(clauses[2].heading, "Non-Reimbursable Expenses");
  // Numbered list items in body text are NOT split into clauses.
  assert.match(clauses[2].text, /Submission:/);
  assert.match(clauses[2].text, /Verification:/);
});
