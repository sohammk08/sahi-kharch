import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "../lib/firebaseAdmin.js";

// Verify the RazorpayX webhook signature: HMAC-SHA256 of the raw body using
// RAZORPAY_WEBHOOK_SECRET, hex-encoded, compared in constant time.
export function verifyWebhookSignature(rawBody, signature, secret) {
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

// POST /api/webhook/razorpayx — must run with express.raw() so the signature
// is computed over the exact body bytes RazorpayX signed.
async function webhookHandler(req, res) {
  const signature = req.headers["x-razorpay-signature"] ?? "";
  const ok = verifyWebhookSignature(
    req.body,
    signature,
    process.env.RAZORPAY_WEBHOOK_SECRET,
  );
  if (!ok) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const payout = req.body?.payload?.payout?.entity;
  if (!payout?.id || !payout?.reference_id) {
    return res.status(200).json({ received: true });
  }
  const { id: payoutId, reference_id: claimId, status } = payout;

  // Ack immediately; RazorpayX retries on non-2xx. Write after the response.
  res.status(200).json({ received: true });

  if (!db) {
    console.error("firebase-admin not configured; cannot record payout status");
    return;
  }
  db.collection("claims")
    .doc(claimId)
    .update({
      payoutStatus: {
        state: status,
        payoutId,
        updatedAt: new Date().toISOString(),
      },
    })
    .catch((err) => console.error("payout status update failed:", err.message));
  db.collection("audit_log")
    .add({
      claimId,
      timestamp: new Date().toISOString(),
      action: "payout_status",
      payoutId,
      status,
      metadata: { payoutState: status },
    })
    .catch((err) => console.error("payout audit write failed:", err.message));
}

export default webhookHandler;