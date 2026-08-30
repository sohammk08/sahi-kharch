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

  // Validates if a string looks like a section heading (starts with
  // uppercase, short length, no trailing dots or colons).
  const isHeading = (s) =>
    /^[A-Z]/.test(s) &&
    !s.includes(":") &&
    !/\.\s*$/.test(s) &&
    s.split(/\s+/).length <= 8;

  // Split by pages (track which page we're on)
  text.split("\f").forEach((pageText, pageIndex) => {
    const lines = pageText.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Try to match "Number + Heading" on a single line
      let m = line.match(/^\s*(\d+(?:\.\d+)*)\.?\s*(.+)$/);
      let heading = m?.[2]?.trim();

      // Handle edge case: Number is on one line, Heading is on the next
      if (!m || !isHeading(heading)) {
        const bm = line.match(/^\s*(\d+(?:\.\d+)*)\.?\s*$/);
        const next = lines[i + 1]?.trim() ?? "";
        if (bm && isHeading(next)) {
          m = [null, bm[1], next];
          heading = next;
          i++;
        }
      }

      // Start a new clause if a heading is matched; otherwise, accumulate text
      if (m && isHeading(heading)) {
        if (current) clauses.push(current);
        current = {
          clauseId: m[1],
          heading,
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
