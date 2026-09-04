import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Initialized only for the payout/webhook routes. FIREBASE_SERVICE_ACCOUNT is a
// base64-encoded JSON service-account key.
const encoded = process.env.FIREBASE_SERVICE_ACCOUNT;
const app =
  getApps().length > 0
    ? getApps()[0]
    : encoded
      ? initializeApp({
          credential: cert(JSON.parse(Buffer.from(encoded, "base64").toString())),
        })
      : null;

export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;