import {
  createPayout,
  createContact,
  createFundAccount,
} from "../lib/razorpayX.js";
import { db, auth } from "../lib/firebaseAdmin.js";

// POST /api/payout — body { claimId }. Requires a Firebase admin ID token in
// the Authorization header. Creates the employee's Contact + Fund Account on
// first use, then triggers the payout with claimId as the idempotency key.
async function payoutHandler(req, res) {
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
    if (!claimSnap.exists)
      return res.status(404).json({ error: "Claim not found" });
    const claim = claimSnap.data();

    if (claim.reviewStatus !== "approved") {
      return res
        .status(400)
        .json({ error: "Only approved claims can be disbursed" });
    }
    const active = ["queued", "processing", "processed"];
    if (active.includes(claim.payoutStatus?.state)) {
      return res.json({
        payoutId: claim.payoutStatus.payoutId,
        state: claim.payoutStatus.state,
      });
    }
    if (!claim.amount || typeof claim.amount !== "number") {
      return res.status(400).json({ error: "Claim has no amount to pay" });
    }

    const empRef = db.collection("users").doc(claim.employeeId);
    const empSnap = await empRef.get();
    if (!empSnap.exists)
      return res.status(404).json({ error: "Employee not found" });
    const emp = empSnap.data();
    const bank = emp.bankAccount;
    if (!bank || (!bank.accountNumber && !bank.vpa)) {
      return res
        .status(400)
        .json({ error: "Employee has no bank/UPI details" });
    }

    // Contact + Fund Account, created once and cached on the user doc.
    let contactId = emp.razorpayContactId;
    if (!contactId) {
      contactId = await createContact({
        name: emp.name,
        email: emp.email,
        contact: emp.phone ?? "9999999999",
      });
      await empRef.update({ razorpayContactId: contactId });
    }
    let fundAccountId = emp.razorpayFundAccountId;
    if (!fundAccountId) {
      fundAccountId = await createFundAccount({
        contactId,
        bank: bank.accountNumber ? bank : undefined,
        vpa: bank.vpa,
      });
      await empRef.update({ razorpayFundAccountId: fundAccountId });
    }

    const { payoutId, state } = await createPayout({
      fundAccountId,
      amountPaise: Math.round(claim.amount * 100),
      referenceId: claimId,
    });

    await claimRef.update({
      payoutStatus: {
        state,
        payoutId,
        updatedAt: new Date().toISOString(),
      },
    });
    await db.collection("audit_log").add({
      claimId,
      timestamp: new Date().toISOString(),
      action: "payout_initiated",
      actorId: decoded.uid,
      actorName: actorDoc.data().name ?? decoded.uid,
      payoutId,
      metadata: { employeeId: claim.employeeId },
    });

    res.json({ payoutId, state });
  } catch (err) {
    console.error("payout error:", err.message);
    res.status(err.status ?? 502).json({ error: err.message });
  }
}

export default payoutHandler;
