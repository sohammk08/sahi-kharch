const BASE = process.env.SARVAM_API_BASE || "https://api.sarvam.ai";
const KEY = process.env.SARVAM_API_KEY;

function headers() {
  return { "api-subscription-key": KEY };
}

// Ask Sarvam to start an extraction job. Uploading is async — Sarvam returns a
// job_id immediately and processes the document in the background
async function createExtractJob(file, filename, schema) {
  const form = new FormData();
  form.append("file", new Blob([file]), filename);
  form.append("schema", JSON.stringify(schema));
  form.append("language", "en-IN");
  form.append("output_format", "json");

  const res = await fetch(`${BASE}/doc-ai/v1/job/extract`, {
    method: "POST",
    headers: headers(),
    body: form,
  });
  if (!res.ok)
    throw new Error(
      `Sarvam extract create failed: ${res.status} ${await res.text()}`,
    );
  return res.json();
}

// Check how far a job has got (e.g. queued, running, completed, failed)
async function getJobStatus(jobId) {
  const res = await fetch(`${BASE}/doc-ai/v1/job/${jobId}/status`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Sarvam status failed: ${res.status}`);
  return res.json();
}

// Pull the finished extracted data for a completed job.
async function getJobResults(jobId) {
  const res = await fetch(
    `${BASE}/doc-ai/v1/job/${jobId}/results?format=json`,
    {
      headers: headers(),
    },
  );
  if (!res.ok)
    throw new Error(`Sarvam results failed: ${res.status} ${await res.text()}`);
  return res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Create an extract job and poll until a terminal status, then return results.
export async function extractDocument(
  file,
  filename,
  schema,
  { interval = 2000, timeout = 120000 } = {},
) {
  const { job_id } = await createExtractJob(file, filename, schema);

  const start = Date.now();
  for (;;) {
    const { status } = await getJobStatus(job_id);
    if (
      ["completed", "partially_completed", "failed", "rejected"].includes(
        status,
      )
    ) {
      const results = await getJobResults(job_id);
      return { jobId: job_id, status, results };
    }
    if (Date.now() - start > timeout)
      throw new Error("Sarvam extract job timed out");
    await sleep(interval);
  }
}
