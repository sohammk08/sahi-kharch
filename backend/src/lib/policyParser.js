import pdfParse from "pdf-parse";

// Extract text from a PDF buffer
export async function extractPolicyText(file) {
  const data = await pdfParse(file);
  return data.text;
}

// Split digitised text into numbered clauses. Uses form feeds as page markers,
// then regex on numbered headings ("3.2.1  Travel Allowance") as clause bounds.
export function chunkClauses(text) {
  const clauses = [];
  let current = null;

  // Split by pages (track which page we're on)
  text.split("\f").forEach((pageText, pageIndex) => {
    for (const line of pageText.split("\n")) {
      const m = line.match(/^\s*(\d+(?:\.\d+)*)\s+(.+)$/);
      if (m) {
        if (current) clauses.push(current);
        current = {
          clauseId: m[1],
          heading: m[2].trim(),
          pageNumber: pageIndex + 1,
          text: [],
        };
      } else if (current) {
        current.text.push(line);
      }
    }
  });
  if (current) clauses.push(current);

  return clauses
    .map((c) => ({
      ...c,
      text: c.text
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim(),
    }))
    .filter((c) => c.text);
}
