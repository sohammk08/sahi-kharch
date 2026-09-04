import { postWithRetry } from "./retry.js";

const BASE = "https://api.razorpayx.com/v1";

// RAZORPAY_MOCK=1 short-circuits every call with fake IDs + a "queued" state,
// so the full payout loop can run without real RazorpayX test keys.
const MOCK = process.env.RAZORPAY_MOCK === "1";

function authHeader() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw Object.assign(new Error("Razorpay not configured"), { status: 503 });
  }
  return {
    Authorization:
      "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
  };
}

// Create a RazorpayX Contact (one per employee, on first use).
export async function createContact({ name, email, contact }) {
  if (MOCK) {
    console.log("[mock] createContact", { name, email, contact });
    return `cont_mock_${Date.now()}`;
  }
  const data = await postWithRetry(
    `${BASE}/contacts`,
    {
      name,
      email,
      contact,
      type: "employee",
      reference_id: email,
    },
    { headers: authHeader() },
  );
  return data.id;
}

// Link a bank account or UPI VPA to a contact. `bank` is { holderName, ifsc,
// accountNumber } or { vpa }.
export async function createFundAccount({ contactId, bank, vpa }) {
  if (MOCK) {
    console.log("[mock] createFundAccount", { contactId, bank, vpa });
    return `fa_mock_${Date.now()}`;
  }
  const data = await postWithRetry(
    `${BASE}/fund_accounts`,
    {
      contact_id: contactId,
      account_type: bank ? "bank_account" : "vpa",
      bank_account: bank ?? undefined,
      vpa: vpa ?? undefined,
    },
    { headers: authHeader() },
  );
  return data.id;
}

// Create a payout. `referenceId` is the idempotency key — RazorpayX dedupes on
// it, so a retry or double-click can never trigger a duplicate reimbursement.
export async function createPayout({ fundAccountId, amountPaise, referenceId }) {
  if (MOCK) {
    console.log("[mock] createPayout", { fundAccountId, amountPaise, referenceId });
    return { payoutId: `pout_mock_${Date.now()}`, state: "queued" };
  }
  const data = await postWithRetry(
    `${BASE}/payouts`,
    {
      fund_account_id: fundAccountId,
      amount: amountPaise,
      currency: "INR",
      mode: "IMPS",
      purpose: "refund",
      reference_id: referenceId,
    },
    { headers: authHeader() },
  );
  return { payoutId: data.id, state: data.status };
}