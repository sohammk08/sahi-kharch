// Map raw backend/system errors to short, user-safe messages. The full detail
// is always logged to the console; the UI only ever sees friendly text.
export function friendlyError(err, fallback = "Something went wrong. Please try again.") {
  const raw = err?.message ?? String(err);
  console.error("friendlyError:", raw);
  if (/duration exceeds the maximum limit/i.test(raw))
    return "Recording too long — voice questions must be under 30 seconds. Try a shorter one.";
  if (/failed to fetch|networkerror|network request failed|fetch failed/i.test(raw))
    return "Can't reach the server. Check that the backend is running and try again.";
  if (/429|too many requests|rate limit/i.test(raw))
    return "The service is busy — wait a moment and try again.";
  if (/timed? ?out|timeout/i.test(raw))
    return "The request took too long. Please try again.";
  if (/missing.*required|required.*missing|required/i.test(raw))
    return "The request was missing required data. Please try again.";
  return fallback;
}