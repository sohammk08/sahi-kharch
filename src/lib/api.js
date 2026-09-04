import { db } from "../firebase.js";
import { getAuth } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

// Parse a receipt via the backend and persist it to Firestore. Returns the
// saved doc's id and parsed fields; throws on failure.
export async function parseAndSaveReceipt(file, userId) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API}/api/receipts/parse`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Extraction failed");
  }
  const { extracted, confidence } = await res.json();
  const ref = await addDoc(collection(db, "receipts"), {
    uploadedBy: userId,
    uploadDate: serverTimestamp(),
    fileName: file.name,
    fileUrl: "",
    extracted,
    confidence,
    status: "parsed",
  });
  return { id: ref.id, fileName: file.name, extracted, confidence };
}

// Small JSON fetch helper against our backend. The backend endpoints are
// computation-only (embedding, LLM); Firestore data flows through the Web SDK.
export async function apiCall(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const parsed = await res.json().catch(() => ({}));
    throw new Error(parsed.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// POST to the backend with the current user's Firebase ID token as a Bearer
// token. The backend verifies it to identify the acting admin.
async function authedPost(path, body) {
  const idToken = await getAuth().currentUser?.getIdToken();
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const parsed = await res.json().catch(() => ({}));
    throw new Error(parsed.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Trigger a RazorpayX payout for an approved claim. The backend verifies the
// admin ID token, so send it along.
export async function disburseClaim(claimId) {
  return authedPost("/api/payout", { claimId });
}

// Mock-only: advance a queued payout to "processed" to simulate the webhook.
export async function advancePayout(claimId) {
  return authedPost("/api/payout/advance", { claimId });
}

// Sarvam-Translate: text, target language code (en-IN / hi-IN / mr-IN / etc.)
export async function translateText(text, target, source = "en-IN") {
  return (
    await apiCall("/api/translate", {
      method: "POST",
      body: { text, source, target },
    })
  ).translated;
}

// Bulbul TTS: text → base64 wav, returned as a playable object URL
export async function speakText(text, language) {
  const { audio } = await apiCall("/api/tts", {
    method: "POST",
    body: { text, language },
  });
  const blob = base64ToBlob(audio, "audio/wav");
  return URL.createObjectURL(blob);
}

// Saarika/Saaras STT: recorded audio blob, transcript in the given language
export async function transcribeAudio(blob, language) {
  const form = new FormData();
  form.append("file", blob, "audio.webm");
  form.append("language", language);
  const res = await fetch(`${API}/api/stt`, { method: "POST", body: form });
  if (!res.ok) {
    const parsed = await res.json().catch(() => ({}));
    throw new Error(parsed.error || `STT failed: ${res.status}`);
  }
  return (await res.json()).transcript;
}

// Decode a base64 string (no data: prefix) into a Blob of the given MIME type
export function base64ToBlob(base64, type = "audio/wav") {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}
