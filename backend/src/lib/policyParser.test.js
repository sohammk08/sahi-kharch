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
