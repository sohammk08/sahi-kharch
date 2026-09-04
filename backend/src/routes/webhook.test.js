import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyWebhookSignature } from "../routes/webhook.js";

const secret = "test-secret";

function sign(body) {
  return createHmac("sha256", secret).update(body).digest("hex");
}

test("verifyWebhookSignature accepts a correct signature", () => {
  const body = JSON.stringify({ event: "payout.processed" });
  assert.equal(verifyWebhookSignature(body, sign(body), secret), true);
});

test("verifyWebhookSignature rejects a tampered body", () => {
  const body = JSON.stringify({ event: "payout.processed" });
  const tampered = body.replace("processed", "failed");
  assert.equal(verifyWebhookSignature(tampered, sign(body), secret), false);
});

test("verifyWebhookSignature rejects a wrong secret", () => {
  const body = JSON.stringify({ event: "payout.processed" });
  assert.equal(
    verifyWebhookSignature(body, sign(body), "other-secret"),
    false,
  );
});

test("verifyWebhookSignature rejects missing signature or secret", () => {
  const body = JSON.stringify({ event: "payout.processed" });
  assert.equal(verifyWebhookSignature(body, "", secret), false);
  assert.equal(verifyWebhookSignature(body, sign(body), ""), false);
});