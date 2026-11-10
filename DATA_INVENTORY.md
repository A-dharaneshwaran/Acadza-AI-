# ACADZA — GIVEN_DATA INVENTORY & ASSET ANALYSIS

This document provides a complete inventory of all files supplied in the `GIVEN_DATA` directory for the Acadza AI Intern "Report → Fix" build-round assignment.

---

## 1. Directory Structure & File Inventory

Recursive scan of `d:\Acadza_AI_intern_Assignment\ACADZA\GIVEN_DATA`:

| File Name | Relative Path | File Type | Size | Record Count | Data Structure | MongoDB Integration Status | Intended Application Feature |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `questions.json` | `GIVEN_DATA/questions.json` | JSON Array | 109,574 B | 43 questions | Array of Question objects with polymorphic subtypes (`scq`, `mcq`, `integerQuestion`), nested HTML + MathML, options, answer keys, solutions, images, and `errorHistory`. | **Imported** into `questions` collection in MongoDB. | Question context retrieval, rendered math view, diff generation, solution evaluation. |
| `reports.json` | `GIVEN_DATA/reports.json` | JSON Array | 9,922 B | 44 reports | Array of Report objects (`reportId`, `questionId`, `studentId`, `source`, `reportedAt`, `comment`). | **Imported** into `reports` collection in MongoDB. | Report intake service, duplicate grouping, prompt injection detection, individualized student replies. |
| `taxonomy.json` | `GIVEN_DATA/taxonomy.json` | JSON Object | 3,396 B | 1 taxonomy doc (7 verdicts, 18 repairs) | Object containing `_about`, `verdicts` dictionary, and `repairs` dictionary specifying `fields`, `auto` boolean, and `label`. | **Imported** into `taxonomies` collection (`acadza_taxonomy_v1`) in MongoDB. | Authoritative taxonomy enforcement, verdict boundaries, repair selection, deterministic routing gates. |

---

## 2. Additional File & Asset Discovery

- **Binary Assets / External Files**:
  A complete recursive search of `GIVEN_DATA` revealed **no external binary files**, images (`.png`, `.jpg`, `.svg`), CSVs, PDFs, or secondary folders.
- **Image References Inside Questions**:
  A comprehensive inspection of all 43 questions (`quesImages` and `solutionImages` arrays, as well as `<img>` tags inside the raw HTML/MathML strings) confirmed that:
  - All `quesImages` arrays are currently empty (`[]`).
  - All `solutionImages` arrays are currently empty (`[]`).
  - Zero `<img>` tags are present in question or solution HTML.
  - One student report (`R025`: `"Figure not given"`) specifically flags a missing diagram. The system correctly records this complaint as a potential `diagram` defect (`taxonomy.repairs.diagram: auto=false`, requiring faculty intervention).
- **Asset Storage Strategy**:
  When image assets or diagram attachments are introduced in production or faculty uploads, they should be stored in an S3-compatible object store (or local `/uploads` directory in development) with references, content types, and metadata indexed in MongoDB. Binary files will never be stored directly in BSON documents.

---

## 3. Data Integrity & Relationship Matrix

- **Total Questions in MongoDB**: 43
- **Total Reports in MongoDB**: 44
- **Distinct Questions Referenced by Reports**: 39
- **Questions with Multiple Reports**:
  - `60f744b3f1b9bc7cc7b4a949`: 3 reports (`R001`, `R002`, `R003`)
  - `60f742f6660d187cc13a8078`: 2 reports (`R007`, `R008`)
  - `622f08d7b70e4b50e4500a1b`: 2 reports (`R009`, `R010`)
  - `612151a6a34397610a9a2e58`: 2 reports (`R018`, `R019`)
- **Unresolved Foreign Keys**: 0 (all 44 reports link to valid questions).

