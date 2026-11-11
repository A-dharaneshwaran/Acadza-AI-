# ACADZA — FRONTEND UI IMPLEMENTATION & ARCHITECTURE REPORT (`UI_IMPLEMENTATION.md`)

This document details the frontend implementation, responsive layout architecture, design system, API service separation, state handling, and startup commands for the **Acadza Faculty Console**.

---

## 1. Technology Choices & Principles

- **Framework**: React 19 (JavaScript, strictly no TypeScript)
- **Tooling & Bundler**: Vite (Fast builds, Hot Module Replacement on port `5173`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite` plugin and modern CSS custom variables)
- **Routing**: React Router DOM (`v7`) with client-side SPA routing
- **Icons**: Lucide React
- **HTML & MathML Sanitization**: `DOMPurify` (Configured to securely allow native MathML tags `<math>`, `<mrow>`, `<mo>`, `<mi>`, `<mn>`, `<mfrac>`, `<msqrt>`, etc.)
- **No Mock Data**: All metrics, cases, question records, and reports are directly retrieved from the real Express.js backend and MongoDB Atlas.
- **Architectural Separation**: Clean boundary between backend APIs (`/api/*`) and frontend UI components. Secrets are strictly forbidden in client-side code.

---

## 2. Directory Structure & Architecture

```
ACADZA/client/
├── .env                          # Local environment: VITE_API_BASE_URL (gitignored)
├── .env.example                  # Environment template without secrets
├── package.json                  # Frontend dependencies and npm scripts
├── vite.config.js                # Vite configuration with Tailwind v4 & port 5173
├── src/
│   ├── index.css                 # Custom design tokens, dark theme variables & scrollbars
│   ├── main.jsx                  # React entry point
│   ├── App.jsx                   # Central routing table
│   │
│   ├── services/                 # Reusable API service layer
│   │   ├── api.js                # Universal fetch wrapper with error handling
│   │   └── caseService.js        # Dedicated case, question, and taxonomy endpoints
│   │
│   ├── components/               # Modular, reusable presentation components
│   │   ├── Layout.jsx            # Shell coordinating collapsible sidebar & navbar
│   │   ├── Sidebar.jsx           # Collapsible left navigation + responsive mobile drawer
│   │   ├── TopNavbar.jsx         # Global search, notification bell & environment pills
│   │   ├── MetricCard.jsx        # Standardized dark metric card with status badges
│   │   ├── QuestionRenderer.jsx  # Native MathML & HTML sanitizer / renderer
│   │   └── CaseDetail.jsx        # Complete 12-section investigation studio & diff preview
│   │
│   └── pages/                    # Route-level screens
│       ├── Dashboard.jsx         # Overview Dashboard (live operational telemetry)
│       ├── ReviewQueue.jsx       # Investigation Queue (search, filter, sort, paginate)
│       ├── CaseDetailPage.jsx    # Standalone Dedicated Case Investigation Page
│       ├── Questions.jsx         # 43 Authoritative Question Bank view
│       ├── Reports.jsx           # 44 Student Feedback Reports table
│       ├── Analytics.jsx         # Quality Assurance telemetry & attack rates
│       └── Settings.jsx          # AI engine parameters & governance rules
```

---

## 3. Academic Design System

The visual design is engineered for faculty members conducting late-night reviews:
- **Canvas / Background**: `#121413` (Deep charcoal with faint dark olive undertones).
- **Surface Panels**: `#161a18` & `#181c1a` (Restrained card containers).
- **Sub-panels & Inputs**: `#121514` & `#101312`.
- **Text Palette**:
  - Primary Text: `#f4f3ee` (Warm off-white for fatigue-free reading).
  - Secondary Text: `#969e99` (Muted sage-grey).
  - Metadata / Subdued: `#626965` & `#78827c`.
- **Accents**:
  - Academic Olive: `#4d7c5f` & `#6ba883` with `#1e2722` badge backdrops.
  - Critical / Adversarial Alert: `#271917` with terracotta border `#4a2723` and `#e07167` indicators.
  - Urgency Tag: `#2b271d` with muted gold `#e0c082`.
- **Borders**: Thin, subtle 1px borders (`#2b312e`).
- **Prohibited Aesthetics**: Zero bright neon colors, zero excessive gradients, zero heavy glassmorphism, and zero oversized decorative cards.

---

## 4. Screens Implemented

### A. Overview Dashboard (`/`)
- Aggregates real metrics via `GET /api/overview/stats`.
- Displays:
  - Total Questions (43)
  - Total Reports (44)
  - Open Investigation Cases (39)
  - Cases Awaiting Faculty Review
  - High-Priority Cases (multi-report or quarantined injection)
  - Live investigation status distribution with proportional progress bars.
  - High-priority cases list with direct links to the review studio.
  - Recent investigation activity stream showing raw student complaints.

### B. Investigation Queue (`/queue`)
- Connects to server-side paginated endpoint `GET /api/cases/paginated`.
- Features:
  - Live debounced text search across Case ID, Question ID, Subject, Chapter, and Comment.
  - Multi-criteria filters: All Priorities, High Priority, Multi-Report (`2+`), and Adversarial Injections.
  - Status filters: `all`, `ready_for_ai`, `needs_faculty_review`, `ai_completed`.
  - Dynamic sorting: `Urgency`, `Most Recent`, `Report Count`, `Subject`.
  - Server-side pagination controls with active page count.
  - Split layout: Click any case on the left to immediately load its full context, rendered question, and solution on the right.

### C. Dedicated Case Investigation Page (`/case/:caseId`)
- Standalone view containing all 12 key investigation sections:
  1. Case Overview (Subject, Chapter, timestamps, report velocity).
  2. Original Question Stem.
  3. Rendered Mathematical Expressions with native MathML (`QuestionRenderer`).
  4. Question Options embedded in question markup.
  5. Official Stored Answer Key.
  6. Supplied Official Solution with working steps.
  7. Student Reports & Individual Feedback comments.
  8. Question Error History (prior faculty corrections).
  9. Injection Risk Indicators (quarantining adversarial commands like `R027`).
  10. AI Investigation Results (verdict, repair type, calibrated confidence).
  11. Evidence & Academic Reasoning findings.
  12. Uncertainties & Read-Only Surgical Diff Preview (`find` vs `replace`).

### D. Auxiliary Supporting Pages
- **Questions Bank** (`/questions`): Searchable directory of the 43 JEE/NEET questions.
- **Reports Log** (`/reports`): Filterable tabular log of all 44 student feedback records.
- **Analytics** (`/analytics`): Intake velocity, injection attack rate, and distribution metrics.
- **Settings** (`/settings`): Engine configuration, model ID, and security parameters.

---

## 5. Interaction States & Error Handling

- **Loading States**: Restrained animated spinners with informative messages (e.g. *"Loading question context and MathML..."*).
- **Error States**: Non-blocking terracotta alert cards with troubleshooting tips (e.g. *"Backend Unreachable: Ensure backend is running on port 5000"*).
- **Empty States**: Clear empty views when search filters yield zero results, avoiding mock records or synthetic placeholders.
- **Accessible Interactions**: Keyboard-navigable inputs, distinct focus borders (`#4d7c5f`), and high contrast ratios.

---

## 6. Frontend Startup & Build Commands

All commands can be executed from the project root `D:\Acadza_AI_intern_Assignment\ACADZA`:

### 1. Start Both Backend and Frontend

**Terminal 1 (Backend - Port 5000):**
```powershell
npm start
```

**Terminal 2 (Frontend Development Server - Port 5173):**
```powershell
npm run dev:client
```
Access the application in your browser at: `http://localhost:5173`

### 2. Build Frontend for Production
```powershell
npm run build:client
```
The build outputs to `client/dist/` in under 1.5 seconds.

