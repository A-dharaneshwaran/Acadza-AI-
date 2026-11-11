# Acadza — Report → Fix Loop

An AI-assisted question quality assurance and faculty correction management system built for Acadza's question bank (~8 lakh JEE/NEET questions). The system sits between informal student error reports and authoritative database corrections, investigating claims, detecting prompt injections, proposing surgical repairs, and providing a high-contrast faculty review console.

---

## 1. Problem Statement & Architecture

Students practicing for competitive exams (JEE/NEET) tap **"Report error"** and type informal complaints:
> *"ans galat hai"* · *"Figure not given"* · *"option D is missing"* · *"Sir root(40^2+30^2)=50 then why 130??"*

Most reports stem from student miscalculations, some represent genuine question or key defects, while others represent display issues, app bugs, or prompt injection attacks. 

The system operates on the core engineering principle:
**AI proposes. Deterministic code validates. Faculty controls. The database preserves truth and history.**

```
Student Reports (44) ─────────┐
                              ▼
                   [Report Intake & Grouping]
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
           [Injection Detector]  [Question Context]
                    │                   │
                    └─────────┬─────────┘
                              ▼
                   [Investigation Case (39)]
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
           [NVIDIA NIM AI]     [Closed Taxonomy]
           (deepseek-v4.1)     (7 Verdicts / 18 Repairs)
                    │                   │
                    └─────────┬─────────┘
                              ▼
                   [Deterministic Validation]
                   (Zod Schema & Scope Bounds)
                              │
                              ▼
                   [Faculty Review Console]
                   (React 19 + MathML Diff)
                              │
                              ▼
                     [results.json (44)]
```

---

## 2. Key Features

- **Authoritative Data Integrity**: 43 real questions, 44 student reports, and closed taxonomy imported with zero data fabrication. Full HTML, inline MathML, and `errorHistory` preserved.
- **Duplicate Report Grouping**: Groups 44 reports into 39 distinct question-level cases (`CASE_<questionId>`), treating volume as an urgency metric rather than proof of a defect.
- **Adversarial Prompt Injection Defense**: Rule-based scanner flagging instruction overrides and privilege escalations (e.g. `R027` flagged with Critical severity) while quarantining student input as untrusted data.
- **Closed Taxonomy Enforcement**: Strict routing across 7 verdicts (`defect`, `no_error`, `display_issue`, `app_issue`, `language_mode`, `already_fixed`, `not_actionable`) and 18 repair types with strict field boundaries.
- **Surgical Diff Proposals**: Generates localized replacements (`{ field, find, replace }`) rather than rewriting full questions.
- **Faculty Review Console (Dark Academic UI)**:
  - Deep charcoal `#121413` palette with subtle olive undertones for late-night review.
  - Native MathML rendering via `DOMPurify` allowing `<math>`, `<mrow>`, `<mfrac>`, `<msqrt>` without distortion.
  - Interactive Review Queue with search, priority filters, sorting, and pagination.
  - Dedicated 12-section Case Detail Page with before/after diffs and student response previews.
- **NVIDIA NIM Free Endpoint Optimization**:
  - Configured with `deepseek-ai/deepseek-v4.1-flash`.
  - Centralized 450-second timeout (`450000ms`) with in-flight concurrency locks (`concurrency: 1`) and anti-retry safeguards.
  - Output token capping (`max_tokens: 600`) and whitespace pruning.

---

## 3. Technology Stack

- **Backend**: Node.js, Express.js, MongoDB Atlas, Mongoose, Zod, Helmet, CORS, dotenv.
- **Frontend**: React 19, Vite, Tailwind CSS v4, React Router DOM (v7), Lucide React, DOMPurify.
- **AI Inference**: NVIDIA NIM Hosted API (`deepseek-ai/deepseek-v4.1-flash`).

---

## 4. Project Directory Structure

```
ACADZA/
├── GIVEN_DATA/                 # Authoritative assignment source files (Read-only)
│   ├── questions.json          # 43 production questions (HTML + MathML)
│   ├── reports.json            # 44 student feedback reports
│   └── taxonomy.json           # Closed taxonomy (7 verdicts, 18 repairs)
│
├── client/                     # React 19 + Vite + Tailwind v4 Faculty Console
│   ├── src/
│   │   ├── components/         # Layout, Sidebar, TopNavbar, MetricCard, CaseDetail, QuestionRenderer
│   │   ├── pages/              # Dashboard, ReviewQueue, CaseDetailPage, Questions, Reports, Analytics
│   │   ├── services/           # api.js, caseService.js
│   │   └── index.css           # Academic design tokens & dark theme
│   ├── vite.config.js          # Vite configuration
│   └── .env.example            # Client environment template
│
├── server/                     # Node.js + Express backend
│   └── src/
│       ├── config/             # database.js, env.js (Centralized config)
│       ├── models/             # Question.js, Report.js, Taxonomy.js, InvestigationCase.js
│       ├── routes/             # healthRoutes.js, caseRoutes.js, overviewRoutes.js, queueRoutes.js
│       └── services/
│           ├── ai/             # investigationContextService, triagePromptService, triageOutputSchema, nvidiaService, triageOrchestrator
│           └── triage/         # reportIntakeService, duplicateGroupingService, injectionDetectionService, taxonomyService, caseGenerationService
│
├── scripts/                    # CLI commands & data pipelines
│   ├── import-given-data.js    # Idempotent database ingestion
│   ├── generate-cases.js       # Builds 39 investigation cases
│   ├── triage-cases.js         # Sequential AI triage runner with safeguards
│   └── generate-results.js     # Validates and writes results.json
│
├── results.json                # Evaluated outputs for all 44 reports
├── PRODUCT.md                  # 1-page product analysis (4 core questions)
├── PROMPTS.md                  # Verbatim prompts, design logs, and 3 AI incidents
├── DATA_INVENTORY.md           # Full asset discovery and data inventory
├── DEMO_SCRIPT.md              # 3-minute screen recording walkthrough
├── SUBMISSION_EMAIL.md         # Submission template with answers
└── README.md                   # This documentation
```

---

## 5. Prerequisites & Environment Setup

### Prerequisites
- Node.js (v18+ or v20+ recommended)
- npm (v9+)
- MongoDB Atlas cluster URI
- NVIDIA NIM API Key (`nvapi-...`)

### Environment Configuration
1. Clone the repository and navigate to the project root:
   ```powershell
   git clone <REPO_URL>
   cd ACADZA
   ```
2. Create `.env` in the project root:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   FRONTEND_ORIGIN=http://localhost:5173

   # MongoDB Atlas
   MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

   # NVIDIA Inference API
   NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
   NVIDIA_MODEL=deepseek-ai/deepseek-v4.1-flash
   NVIDIA_API_KEY=your_nvidia_api_key_here
   NVIDIA_REQUEST_TIMEOUT=450000
   NVIDIA_MAX_OUTPUT_TOKENS=600
   NVIDIA_MAX_CONCURRENT_REQUESTS=1

   # Authentication
   JWT_SECRET=your_jwt_secret_key
   ADMIN_EMAIL=acadzaaiintern@gmail.com
   ADMIN_PASSWORD=your_secure_password
   ```
3. Create `client/.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

---

## 6. Installation & Execution

### 1. Install Dependencies
```powershell
# Root backend dependencies
npm install

# Client frontend dependencies
npm --prefix client install
```

### 2. Ingest Data & Generate Cases
```powershell
# Idempotently import 43 questions, 44 reports, and taxonomy into MongoDB
npm run import-data

# Group reports into 39 investigation cases with injection scanning
npm run generate-cases
```

### 3. Start Backend & Frontend
```powershell
# Terminal 1: Start Express Backend (Port 5000)
npm start

# Terminal 2: Start React Frontend (Port 5173)
npm run dev:client
```
Visit `http://localhost:5173` to access the Faculty Console.

### 4. Build Frontend for Production
```powershell
npm run build:client
```

---

## 7. AI Triage Engine CLI (`triage-cases.js`)

Inference is executed exclusively via explicit CLI commands with strict safeguards (zero automatic execution):

```powershell
# Triage a specific case (default concurrency: 1, timeout: 450s)
npm run triage-cases -- --case CASE_60f744b3f1b9bc7cc7b4a949

# Re-run a case with explicit force mode
npm run triage-cases -- --case CASE_60f744b3f1b9bc7cc7b4a949 --force

# Process next pending case (default limit: 1)
npm run triage-cases -- --limit 1
```

---

## 8. API Endpoint Overview

- `GET /api/health`: Local static health and database connectivity check (zero external inference calls).
- `GET /api/overview/stats`: Real-time MongoDB metrics (questions, reports, open cases, status breakdown).
- `GET /api/cases/paginated`: Searchable, filterable, and paginated investigation queue.
- `GET /api/cases/:caseId`: Full investigation case context with rendered MathML, options, and solution.
- `GET /api/taxonomy`: Authoritative taxonomy rules (7 verdicts, 18 repairs).

---

## 9. Security & Governance Principles

1. **Quarantined Untrusted Input**: Student comments are treated strictly as claims to investigate, never executable instructions.
2. **Zero In-Flight Duplication**: Case status is locked as `processing` before network calls are dispatched.
3. **No Blind Retries**: Rate limits (HTTP 429) and timeouts stop execution immediately to conserve quota.
4. **Faculty Authority**: Human-only repairs (`auto: false`) and answer key changes are gated behind human faculty approval.
