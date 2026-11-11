# PROMPTS & SYSTEM DIRECTIVES LOG

This document contains all prompts inside the Acadza system, AI coding assistant instructions, version histories, and design logs.

---

## 1. Master Context & Phase 01 Implementation Prompt (v1.0)

```markdown
ACADZA — REPORT → FIX
MASTER PROJECT CONTEXT + PHASE 01 IMPLEMENTATION
You are the senior full-stack engineer and AI systems architect working on the Acadza AI Intern build-round assignment.
You must understand the complete product, its requirements, architecture, technology choices, security principles and implementation roadmap before making changes.
The human developer will review every implementation phase. Do not independently proceed to future phases.
...
[Phase 01 Master Prompt: Data Ingestion, Mongoose Models, Health Endpoint, NVIDIA NIM Client]
```

---

## 2. Phase 02 Implementation Prompt (v1.0)

```markdown
PROJECT: Acadza — Report → Fix Loop

PHASE 02: COMPLETE DATA INTEGRATION & REPORT INTAKE

Continue from the existing Phase 01 implementation.

PRIMARY OBJECTIVE:

Ensure that ALL supplied assignment data is properly integrated into MongoDB, preserved without information loss, and accessible to the backend.

Then build the report intake and duplicate grouping foundation that will feed the AI investigation engine in the next phase.

==================================================
IMPORTANT DEVELOPMENT RULES
==================================================

1. Implement Phase 02 only.
2. Do not rebuild the existing project.
3. Do not modify, move, rename, or delete anything inside GIVEN_DATA.
4. Preserve all original source files exactly as supplied.
5. Use JavaScript, Node.js, Express, MongoDB and Mongoose.
6. Do not introduce TypeScript, Python, FastAPI, or unnecessary dependencies.
7. Do not use mock data, fabricated records, or hardcoded investigation results.
8. Do not call NVIDIA APIs in this phase.
9. Do not implement the frontend yet.
10. Do not overwrite existing credentials or environment configuration.
11. Reuse existing Phase 01 models and services wherever appropriate.
12. Do not create duplicate collections or duplicate records unnecessarily.
13. Do not silently discard unknown fields from supplied data.

==================================================
PART 1 — COMPLETE GIVEN_DATA DISCOVERY
==================================================

Inspect the entire GIVEN_DATA directory recursively.
Identify every supplied file, including JSON, CSV, Images, etc.
Create a complete inventory.

==================================================
PART 2 — COMPLETE MONGODB DATA INTEGRATION
==================================================

Inspect MongoDB models and import implementation.
Ensure all relevant supplied data is accessible through MongoDB.
Preserve every question, report, and taxonomy field without information loss.

==================================================
PART 3 — DATA RELATIONSHIP PRESERVATION
==================================================

Ensure relationships between datasets remain intact.
Reports reference correct question IDs; questions retain image references and errorHistory.

==================================================
PART 4 — REPORT INTAKE SERVICE
==================================================

Create report intake service in server/src/services/triage/reportIntakeService.js.

==================================================
PART 5 — DUPLICATE REPORT GROUPING
==================================================

Implement grouping by questionId in server/src/services/triage/duplicateGroupingService.js.

==================================================
PART 6 — PROMPT INJECTION RISK DETECTION
==================================================

Create dedicated injection detector in server/src/services/triage/injectionDetectionService.js.
Test with R027.

==================================================
PART 7 — INVESTIGATION CASE MODEL
==================================================

Create Mongoose model in server/src/models/InvestigationCase.js.

==================================================
PART 8 — CASE GENERATION SERVICE
==================================================

Create case generator in server/src/services/triage/caseGenerationService.js.

==================================================
PART 9 — TAXONOMY SERVICE
==================================================

Create taxonomy accessor in server/src/services/triage/taxonomyService.js.

==================================================
PART 10 — COMMAND-LINE EXECUTION
==================================================

Provide scripts and npm scripts to run intake and case generation.

==================================================
PART 11 — DOCUMENTATION
==================================================

Create DATA_INVENTORY.md, PHASE_02_IMPLEMENTATION.md, and update PROMPTS.md.
```

---

## 3. Design Decisions Log (Phase 01 & Phase 02)

1. **Idempotent Upsert Strategy**:
   - Both data ingestion and case generation use deterministic upsert patterns (`filter: { _id }` / `filter: { questionId }`). Multiple runs never duplicate records or increment counts.
2. **Untrusted Student Input Paradigm**:
   - The injection detector does not act as the sole barrier. Every student comment is treated as untrusted data regardless of whether an indicator is detected. Student comments are structured solely as leads or evidence for investigation, never executable instructions.
3. **Preservation of Raw HTML & MathML**:
   - In Mongoose schemas, `strict: false` is enabled and question payloads are preserved verbatim so that native MathML rendering in modern browsers works without malformed re-encoding.
4. **Grouped Investigation vs Individual Outputs**:
   - Cases are grouped per question (`CASE_<questionId>`) to investigate root causes efficiently once per question while preserving all individual student reports and comments for individualized reply synthesis in later phases.



---

## 4. Phase 03 Finalization & Timeout Update Prompt (v3.1)

```markdown
PROJECT: ACADZA — REPORT → FIX LOOP
TASK: PHASE 03 FINALIZATION + NVIDIA TIMEOUT UPDATE
VERSION: 3.1

PRIMARY OBJECTIVE:
Finalize the existing Phase 03 AI Investigation & Triage Engine.
Additionally, increase the NVIDIA inference timeout to exactly 450 seconds.
The implementation must be completed without making ANY NVIDIA API requests.
This is a code implementation and integration task, NOT an inference execution task.

PART 1: Set NVIDIA_REQUEST_TIMEOUT=450000 across configuration and services.
PART 2: Strict request safety - zero automatic retries, concurrency 1, manual recovery on timeouts.
PART 3-8: Context service, prompt builder, Zod schema, NVIDIA service, and Orchestrator finalization.
PART 9-11: CLI safeguards, Faculty Console integration, and Health endpoint isolation.
PART 12-14: Token tracking and local non-inference validation.
```

### Design Decisions Log (Version 3.1 Updates):
1. **450-Second (450,000 ms) Centralized Timeout**:
   - Accommodates NVIDIA free endpoint queue latency under peak load without premature client-side aborts.
2. **Double-Submission & In-Flight Lock**:
   - Cases mark status as `processing` in MongoDB before making network requests. Any duplicate submission while a request is in flight is rejected.
3. **Manual Recovery Safeguard for Timed-Out Cases**:
   - Because a client-side timeout does not guarantee the upstream model stopped, timed-out cases flag `requiresManualRecovery: true` and cannot be re-run by automated batches without manual `--force` confirmation.
4. **Health Endpoint Decoupling**:
   - `/api/health` performs strictly local database and environment checks; no inference tokens are ever consumed by polling or dashboard navigation.
