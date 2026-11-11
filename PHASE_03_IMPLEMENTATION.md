# ACADZA — PHASE 03 IMPLEMENTATION REPORT
## AI INVESTIGATION & TRIAGE ENGINE (VERSION 3.1)

This report details the finalization of **Phase 03 (AI Investigation & Triage Engine — Version 3.1)**, incorporating the **450-second (450,000 ms)** inference timeout update, strict anti-retry safeguards, active processing locks, and zero-token consumption governance.

---

### 1. Final Phase 03 Architecture

```
Investigation Case (MongoDB)
       │
       ▼
[InvestigationContextService]  ─── Token pruning, sanitization & MathML preservation
       │
       ▼
[TriagePromptService]          ─── Quarantines untrusted student comments in JSON payload
       │
       ▼
[NvidiaService]                ─── Timeout: 450,000 ms (450s), max_tokens: 600, concurrency: 1
       │
       ▼
[Zod Schema Validation]        ─── Validates against 7 taxonomy verdicts & closed repairs
       │
       ▼
[TriageOrchestrator]           ─── In-flight locks, manual recovery guards & token usage persistence
```

---

### 2. Timeout Configuration & Update

- **Previous Configured Timeout**: 240,000 ms (4 minutes) / 30,000 ms initial default.
- **New Configured Timeout**: **`450000` ms (450 seconds / 7 minutes 30 seconds)**.
- **Centralized Parameter**: Configured in `.env` as `NVIDIA_REQUEST_TIMEOUT=450000` and parsed numerically in `server/src/config/env.js`.
- **Actual HTTP Client Verification**: Confirmed that `server/src/services/ai/nvidiaService.js` and `server/src/services/ai/nvidiaClient.js` pass `timeout: config.nvidia.requestTimeoutMs` (`450000`) directly to the underlying OpenAI SDK and HTTPS options.

---

### 3. Strict Request & Anti-Retry Safeguards

To prevent quota exhaustion on the free NVIDIA endpoint:
1. **Zero Automatic Retries**: No retries on HTTP 429, timeouts, network hang-ups, or provider errors.
2. **In-Flight Concurrency Lock**: `triageOrchestrator.js` atomically updates `aiTriage.status = 'processing'` prior to network dispatch. Any duplicate concurrent submission for the same case is **strictly rejected** (even if `--force` is passed).
3. **Timeout Recovery Safeguard**:
   - If a request times out at 450 seconds, it is marked with:
     ```json
     {
       "status": "failed",
       "errorCategory": "timeout",
       "requiresManualRecovery": true
     }
     ```
   - Subsequent automated runs will **refuse to resubmit** a timed-out case unless the developer explicitly provides `--force` after verifying the server state.
4. **Health Endpoint Isolation**: `server/src/routes/healthRoutes.js` performs strictly local database and environment checks. It will **never** trigger live inference.

---

### 4. Investigation Context & Secure Prompt Design

- **Context Service (`investigationContextService.js`)**:
  - Extracts real question stems, inline MathML formulas, options, answer keys, solutions, and `errorHistory` from MongoDB.
  - Normalizes redundant HTML whitespace while preserving mathematical tags (`<math>`, `<mrow>`, `<mfrac>`, `<msqrt>`).
  - Deduplicates identical student complaints while preserving all associated `reportId`s.
- **Secure Prompt Builder (`triagePromptService.js`)**:
  - Quarantines student claims in an `untrustedClaims` payload.
  - Injects injection detection telemetry without modifying system boundaries.
  - Commands the LLM to output pure JSON with zero markdown fences or conversational preambles.

---

### 5. Structured Output Validation (`triageOutputSchema.js`)

Enforced via Zod before any persistence:
- **Verdicts (7 Closed Taxonomy Keys)**: `defect`, `no_error`, `display_issue`, `app_issue`, `language_mode`, `already_fixed`, `not_actionable`.
- **Repairs**: Must be one of the 18 closed taxonomy keys or `null`.
- **Target Fields**: Validated against permitted repair fields.
- **Confidence**: Real float between `0.0` and `1.0`.
- **Identifiers**: Case ID and Question ID must match the requested case.

---

### 6. Faculty Console Integration

Updated `client/src/pages/CaseDetailPage.jsx` to render real `aiTriage` data:
- AI Verdict, Recommended Repair, and Calibrated Confidence.
- Step-by-step academic reasoning and evidence items.
- Provider token usage telemetry (`promptTokens`, `completionTokens`, `totalTokens`, and latency) when returned by NVIDIA.
- Processing in-flight spinner banner when status is `processing`.
- Clear failure and manual recovery banners when a request has timed out.
- Before/after surgical diff preview component.
- Strictly read-only: opening pages, navigating, or refreshing the console never triggers inference calls.

---

### 7. CLI Execution Commands

Processing must be initiated explicitly via the CLI:
- **Process a specific case**:
  ```powershell
  npm run triage-cases -- --case CASE_60f744b3f1b9bc7cc7b4a949
  ```
- **Force re-evaluation of a previously failed case**:
  ```powershell
  npm run triage-cases -- --case CASE_60f744b3f1b9bc7cc7b4a949 --force
  ```
- **Process a limited batch (sequential, default concurrency 1)**:
  ```powershell
  npm run triage-cases -- --limit 3
  ```
