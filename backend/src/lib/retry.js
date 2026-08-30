const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// POST helper with exponential backoff on 429 / 5xx / network errors.
// Returns the parsed JSON body.
export async function postWithRetry(url, body, options = {}) {
  const { headers = {}, attempts = 4, parseJson = true } = options;
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body),
      });
    } catch (err) {
      lastErr = err;
      res = null;
    }
    if (res && res.ok) {
      return parseJson ? res.json() : res;
    }
    const text = res ? await res.text().catch(() => "") : "";
    // Non-retryable client error (4xx other than 429) → fail fast.
    if (res && res.status !== 429 && res.status < 500) {
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    lastErr = new Error(`HTTP ${res?.status ?? "network"}: ${text}`);
    if (i < attempts - 1) await sleep(1000 * 2 ** i);
  }
  throw lastErr;
}
