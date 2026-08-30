const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

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
