# ACADZA — PHASE 03 IMPLEMENTATION REPORT
## AI INVESTIGATION & TRIAGE ENGINE (FREE ENDPOINT OPTIMIZED)

Phase 03 establishes a reusable, token-efficient AI triage engine that evaluates academic questions and student feedback using the NVIDIA hosted inference API (`deepseek-ai/deepseek-v4.1-flash`) while enforcing strict taxonomy rules and prompt injection defense.

---

### 1. AI Investigation Architecture

The triage engine operates through a modular pipeline with isolated boundaries:

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
[NvidiaService]                ─── Single inference call (max_tokens: 600, temperature: 0.1)
       │
       ▼
[Zod Schema Validation]        ─── Validates against 7 taxonomy verdicts & closed repairs
       │
       ▼
[TriageOrchestrator]           ─── Persists aiTriage record & token usage into MongoDB Atlas
```

---

### 2. Supported Taxonomy Verdicts & Repair Types

- **Verdicts (7 closed categories)**:
  - `defect`: Genuine content or answer-key error in question, solution, or options.
  - `no_error`: Checked and correct; student miscalculated or misunderstood.
  - `display_issue`: Content is correct; client-side rendering or layout glitch.
  - `app_issue`: Platform-level behavioral defect (input lag, option capture).
  - `language_mode`: Student requested another language medium (e.g. Hindi).
  - `already_fixed`: Prior `errorHistory` confirms problem was resolved.
  - `not_actionable`: Vague or unintelligible feedback.

- **Repairs (18 closed categories)**:
  - Auto-eligible (`auto: true`): `spelling`, `noise`, `exam_reference`, `markup_leak`, `answer_form`, `notation`, `stem_data`, `option_repair`, `solution_fix`, `solution_missing`, `answer_key`, `type_mismatch`.
  - Human-only review required (`auto: false`): `identical_options`, `diagram`, `wrong_question`, `unsound`, `wrong_chapter`, `syllabus`.

---

### 3. Token Optimization & Free Endpoint Strategy

To prevent quota exhaustion on NVIDIA's free endpoint:
1. **Context Pruning**: Normalized whitespace in question HTML while retaining all MathML tags (`<math>`, `<mfrac>`, `<msqrt>`). Removed empty image arrays and redundant metadata.
2. **Comment Deduplication**: Merged identical student comments per question (e.g. repeated `"wrong"` reports) into a single claim entry while preserving all associated `reportId`s.
3. **Strict Output Token Capping**: Configured `max_tokens: 600` in `.env` to prevent verbose conversational generation.
4. **Token Usage Telemetry**: Extracted and recorded `promptTokens`, `completionTokens`, and `totalTokens` directly from NVIDIA response headers.
5. **Rate-Limit & Quota Protection**: Immediate halt on HTTP 429 or quota exhaustion without blind retry loops.
6. **In-Flight Lock**: Sets `aiTriage.status = 'processing'` prior to network dispatch to reject overlapping requests.

---

### 4. Structured Output Schema (`triageOutputSchema.js`)

Validated via Zod before any database write:
```json
{
  "caseId": "CASE_60f744b3f1b9bc7cc7b4a949",
  "questionId": "60f744b3f1b9bc7cc7b4a949",
  "verdict": "defect",
  "repairType": "answer_key",
  "targetFields": ["answer", "solution"],
  "summary": "String",
  "reasoning": "String",
  "evidence": [
    {
      "source": "student_comment | stored_solution | stored_question | math_calculation",
      "reportId": "R001",
      "exactText": "String",
      "explanation": "String"
    }
  ],
  "confidence": 0.95,
  "facultyReviewRequired": true,
  "injectionRiskConsidered": true,
  "uncertainties": [],
  "recommendedAction": "faculty_review"
}
```

---

### 5. CLI Invocation Commands

The engine is controlled exclusively via explicit CLI commands (zero automatic runs):

- **Process a specific case**:
  ```powershell
  npm run triage-cases -- --case CASE_60f744b3f1b9bc7cc7b4a949
  ```
- **Force re-evaluation of a previously failed case**:
  ```powershell
  npm run triage-cases -- --case CASE_60f744b3f1b9bc7cc7b4a949 --force
  ```
- **Process a limited batch of pending cases**:
  ```powershell
  npm run triage-cases -- --limit 3
  ```

---

### 6. Scope Boundaries & Current State

- **Zero Mock Data**: Only real MongoDB records and authoritative taxonomy are used.
- **Pure Read-Only UI**: The Faculty Console displays AI results, evidence, and surgical diff previews when persisted, but cannot trigger live inference or write unauthorized corrections.
- **Standing Status**: All background inference tasks are stopped. Zero active API calls are running.

Documentation:
- Implementation Report: [PHASE_03_IMPLEMENTATION.md](file:///d:/Acadza_AI_intern_Assignment/ACADZA/PHASE_03_IMPLEMENTATION.md)
- Prompts & Security Log: [PROMPTS.md](file:///d:/Acadza_AI_intern_Assignment/ACADZA/PROMPTS.md)
- UI Implementation: [UI_IMPLEMENTATION.md](file:///d:/Acadza_AI_intern_Assignment/ACADZA/UI_IMPLEMENTATION.md)
