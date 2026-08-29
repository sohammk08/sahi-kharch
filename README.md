# Sahi Kharch

Risk-aware, multilingual expense policy checker. A Razorpay AI Buildathon project.

Sahi Kharch is an agent that sits between a company expense policy and an employee
claim. It gives a verdict backed by the exact policy clause, explains that
verdict in the employee's own language (typed or spoken, including natural
code-mixing like Hinglish), and can actually trigger the reimbursement payout
once a claim is approved, closing the loop end to end.

## The Problem

Most mid-to-large Indian companies run expense reimbursement the same way: an
employee submits a receipt, and someone in finance manually checks it against a
20 to 60 page policy PDF, usually written only in English. Three things go
wrong at scale:

1. **Inconsistency.** Two reviewers interpret an ambiguous clause differently;
   the same claim gets approved for one employee and rejected for another.
2. **No real audit trail.** A status is stamped with no record of which clause
   justified it, which becomes a problem the moment an auditor asks "why".
3. **Language exclusion.** A large share of claim-submitting staff (field
   sales, plant and warehouse workers, regional offices) is more comfortable
   asking "Ye claim allowed hai kya?" in Hindi, Marathi, Telugu, or Kannada
   than reading an English policy clause.

## What It Covers

**In scope:**

- Ingest one or more versioned company expense policy documents.
- Ingest a receipt (image or PDF) and extract structured claim data.
- Produce a verdict: Approved / Flagged / Rejected / Needs Human Review,
  backed by exact clause text, clause ID, and page number.
- A composite risk score, not just a binary decision.
- Multilingual interaction (English, Hindi, Marathi, Telugu, Kannada, and more)
  via Sarvam AI, including code-mixed queries.
- A finance/admin exception queue for anything the system cannot confidently
  resolve.
- A light RazorpayX Payouts integration (test mode) that disburses an approved
  reimbursement, demonstrating a closed loop from receipt upload to money sent.

**Out of scope for the buildathon build:** full payroll/HRMS integration,
multi-level approval workflows, GST filing, and production user management.
These are v2 features, not needed to prove the core idea.

## High-Level Architecture

```mermaid
flowchart TB
    subgraph Input["Input Layer"]
        A1[Employee: photo/PDF of receipt]
        A2[Employee: typed or spoken question in any supported language]
        A3[Finance Admin: policy document upload]
    end

    subgraph Multilingual["Multilingual Interaction Layer, Sarvam AI"]
        B1[Saarika / Saaras, Speech to Text + real-time translation]
        B2[Sarvam-Translate / Mayura, text translation incl. code-mixed input]
        B3[Bulbul TTS, spoken response, code-switch capable]
    end

    subgraph Ingestion["Ingestion & Extraction"]
        C1[Policy Parser: PDF/DOCX to Indexed Clauses]
        C2[Receipt Parser: OCR + vision field extraction]
        C3[Vector Store: policy clause embeddings]
    end

    subgraph Core["Risk & Compliance Decision Core"]
        D1[Retrieval: relevant clauses for this claim]
        D2[Deterministic Rules: caps, blacklists, duplicates, date windows]
        D3[LLM Judgment: reasons over retrieved clauses, cites exact clause]
        D4[Risk Scoring: severity + OCR confidence + anomaly signals]
        D5[Verdict + Evidence Bundle]
    end

    subgraph Audit["Audit & Human-in-the-loop"]
        E1[Immutable decision log]
        E2[Finance exception dashboard]
    end

    subgraph Payout["Reimbursement Layer, RazorpayX (Test Mode)"]
        F1[Contact + Fund Account]
        F2[Create Payout, idempotency key = claim ID]
        F3[Webhook: payout status]
    end

    A1 --> C2
    A3 --> C1
    C1 --> C3
    A2 --> B1 --> B2
    B2 --> D1
    C2 --> D1
    C3 --> D1 --> D2 --> D3 --> D4 --> D5
    D5 --> B2 --> B3 --> A2
    D5 --> E1
    D5 -->|Needs Human Review| E2
    E2 -->|Override / Approve| E1
    D5 -->|Approved| F1 --> F2 --> F3 --> E1
```

There is exactly one decision core. The multilingual layer is a translation
shell wrapped around it, not five separate reasoning pipelines. A claim
reasoned about in Hindi and the identical claim in Telugu must produce the same
verdict and the same cited clause. One canonical decision, many front doors.

## Component Breakdown

### Policy Ingestion

Accepts a PDF/DOCX policy and parses it into clause-level chunks, each tagged
with a clause ID, section heading, page number, and effective-from date (for
policy versioning). Chunks are embedded into a vector index for retrieval and
kept in a structured table for exact-text lookup. Exact clause text shown to
the user always comes from the structured store, never a paraphrase, to avoid
drift from the source.

### Receipt Ingestion

Extracts vendor name, date, amount, currency, tax/GST breakup, and an inferred
category (travel, meals, client entertainment, etc.) via vision-based document
extraction. Runs quality checks (legibility, GSTIN presence when required, date
within claim window) flagged as extraction-confidence issues, distinct from
policy-violation issues.

### Risk & Compliance Decision Core

Runs in two stages rather than asking an LLM to "just decide":

1. **Deterministic rules first.** Unambiguous numeric thresholds (hotel cap,
   per-diem limit, blacklisted category, duplicate receipt hash, filing
   deadline) are checked with plain code. An LLM should never be the thing
   enforcing "2,000 rupees per day", because it can be talked out of a hard
   number.
2. **LLM reasoning for ambiguous cases.** Vaguer policy language (reasonable
   client entertainment, appropriate for grade) is reasoned over by the LLM,
   given only the retrieved clause text plus claim data, and required to ground
   its explanation in that text.
3. **Risk scoring.** Every claim gets a composite score combining violation
   severity, extraction confidence, and anomaly signals (duplicate submission,
   round amounts, invoice splitting, vendor spikes). The score routes a claim
   to auto-approve, auto-flag, or the human exception queue.

### Audit & Human-in-the-Loop

Every verdict, cited clause, risk score component, and human override is
written to an append-only log: a permanent, inspectable record of why the
decision was made. A finance/admin dashboard surfaces only the claims needing
attention, each with its evidence bundle pre-assembled.

### Reimbursement Layer (RazorpayX Payouts, Test Mode)

See Section 7 for the full walkthrough.

## The Multilingual Layer and Sarvam AI

Sarvam's models are trained specifically on Indian language data, including
natural code-switching, so mixed-script, mixed-language input is handled
natively.

- **Voice input (Saaras / Saarika):** real-time speech-to-text with translation,
  so queries reach the decision core as clean text.
- **Text translation (Sarvam-Translate / Mayura):** typed queries in any
  supported language, formal or code-mixed, are normalized before retrieval and
  reasoning; output is translated back for the response.
- **Voice output (Bulbul TTS):** explanations read back in natural
  code-switched speech for staff who prefer hearing an answer.
- **Document/OCR assist (Sarvam Parse):** a second option for receipts and
  policy documents in a regional language.

## The RazorpayX Integration (Light, Test-Mode)

The buildathon framing rewards showing a closed loop with a real audit trail, so
Sahi Kharch adds one deliberately small, real integration: on approval, it triggers
the reimbursement through RazorpayX Payouts in test mode.

1. **Contact:** each employee is one RazorpayX Contact, created on first use.
2. **Fund Account:** the employee's bank account or UPI VPA linked to that
   Contact (test mode can be seeded with dummy data).
3. **Payout:** created on approval for the claimed amount. The claim ID is both
   the payout reference and the idempotency key, so a retry or a UI double-click
   can never trigger a duplicate reimbursement.
4. **Webhook:** RazorpayX sends lifecycle updates (queued, processing,
   processed, reversed, failed); Sahi Kharch updates the claim's audit trail, so
   the record reads "Approved to Payout `pout_XXXX` to Processed on [date]".

Scoped as "light" because test mode uses a dummy balance and payouts must be
advanced manually from the dashboard, which is exactly right for a controlled
demo.

## Real-World Scenarios

- **Field sales executive, Nagpur.** Uploads fuel and hotel receipts as photos,
  asks in Marathi whether the hotel charge clears the per-night cap. Gets an
  instant verdict with the exact clause, and sees the reimbursement move to
  processing if approved.
- **Finance team, 500-person company, month-end.** Runs ~300 claims through the
  system and reviews only the small fraction the risk engine could not
  confidently resolve, each with evidence assembled.
- **New employee.** Types a Hindi question about a dinner bill and gets a clear
  answer with the specific meal-allowance clause.
- **Compliance review, six months later.** An auditor sees the exact cited
  clause, risk score components, and payout ID in the immutable log in seconds.

## Product Specifics

**Positioning:** a risk-aware, multilingual expense-compliance co-pilot for
Indian finance teams and their distributed, non-English-first workforce.

**Primary users:** employees (claim submitters), finance/AP reviewers, and
compliance/audit.

**Key differentiators:**

1. Clause-level citation on every verdict: explainability and audit trail are
   the product.
2. Genuine Indian-language support including natural code-mixing, not a
   translated English UI.
3. A closed reimbursement loop demonstrated against RazorpayX test-mode APIs.
4. Risk scoring instead of a binary gate, surfacing how risky and why.

**Suggested MVP scope for the buildathon window:**

- One realistic company expense policy document (synthesized for the demo).
- 30 to 50 synthetic receipts spanning clean approvals, clear violations, and
  ambiguous cases.
- Full pipeline live for at least 5 languages (English, Hindi, Marathi, Telugu,
  Kannada).
- One complete end-to-end RazorpayX payout demonstrated live.
- An exception dashboard with several claims routed to human review.

**Metrics to report:**

- Precision/recall (or an approve/flag/reject confusion matrix) against the
  synthetic claim set, including the false-positive cost.
- Percent of claims auto-resolved vs. sent to human review, with an honest list
  of what the system could not resolve and why.
- Consistency check: the same claim asked in two languages returns the same
  verdict and cited clause.
- Average end-to-end latency per claim (receipt upload to verdict).

## Suggested Tech Stack (What, Not Code)

| Layer | Role |
| --- | --- |
| Orchestration backend | Coordinates ingestion, retrieval, rules, LLM judgment, risk score, response/payout. |
| Vector store | Holds embedded policy clauses for retrieval. |
| Structured claims database | Stores claims, extracted receipt fields, verdicts, risk scores, and the append-only audit log. |
| LLM (reasoning core) | Clause-grounded judgment on ambiguous cases and plain-language explanations. |
| Sarvam AI APIs | Saarika/Saaras (speech-to-text + translate), Sarvam-Translate/Mayura (text translation), Bulbul (text-to-speech), optionally Sarvam Parse for vernacular OCR. |
| Vision/OCR | Extracts vendor, amount, date, tax from receipt images/PDFs. |
| RazorpayX Payouts API (test mode) | Contact to Fund Account to Payout to Webhook for the closed-loop demo. |
| Frontend | Employee-facing chat/voice interface, plus a finance/admin dashboard. |

## The Frontend (This Repo)

This repository currently contains the frontend, a React + Vite app with
Tailwind CSS. See `src/` for components and `public/` for static assets.

## Local Development

```bash
npm install      # or pnpm install
npm run dev      # start the Vite dev server
npm run build    # production build
npm run lint     # lint with ESLint
```
