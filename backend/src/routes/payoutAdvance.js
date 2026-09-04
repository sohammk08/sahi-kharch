import { db, auth } from "../lib/firebaseAdmin.js";

// POST /api/payout/advance — body { claimId }. Mock-only: simulates RazorpayX
// marking a payout "processed", writing the same audit entry the real webhook
// would. Requires a Firebase admin ID token.
async function payoutAdvanceHandler(req, res) {
  if (process.env.RAZORPAY_MOCK !== "1") {
    return res.status(403).json({ error: "Mock mode only" });
  }
  if (!db || !auth) {
    return res.status(503).json({ error: "Firebase Admin not configured" });
  }
  const { claimId } = req.body ?? {};
  if (!claimId) {
    return res.status(400).json({ error: "claimId required" });
  }

  try {
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing auth token" });
    const decoded = await auth.verifyIdToken(token);
    const actorDoc = await db.collection("users").doc(decoded.uid).get();
    if (!actorDoc.exists || actorDoc.data().role !== "admin") {
      return res.status(403).json({ error: "Admins only" });
    }

    const claimRef = db.collection("claims").doc(claimId);
    const claimSnap = await claimRef.get();
    if (!claimSnap.exists) return res.status(404).json({ error: "Claim not found" });
    const claim = claimSnap.data();

    if (claim.payoutStatus?.state !== "queued") {
      return res.status(400).json({ error: "Only queued payouts can be advanced" });
    }
    const payoutId = claim.payoutStatus.payoutId;

    await claimRef.update({
      payoutStatus: {
        state: "processed",
        payoutId,
        updatedAt: new Date().toISOString(),
      },
    });
    await db.collection("audit_log").add({
      claimId,
      timestamp: new Date().toISOString(),
      action: "payout_status",
      payoutId,
      status: "processed",
      metadata: { payoutState: "processed" },
    });

    res.json({ payoutId, state: "processed" });
  } catch (err) {
    console.error("payout advance error:", err.message);
    res.status(err.status ?? 502).json({ error: err.message });
  }
}

export default payoutAdvanceHandler;