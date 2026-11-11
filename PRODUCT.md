# PRODUCT ANALYSIS: THE REPORT → FIX SYSTEM

## 1. Who Loses the Most?

In Acadza's ecosystem serving approximately 8 lakh students across India, **the serious, borderline JEE/NEET aspirant loses the most**.

In high-stakes examinations, a single question can carry significant consequences. A defective question, incorrect answer key, or misleading solution can affect a student's score, confidence, preparation strategy, and trust in the platform.

### Confidence Destruction

An ambitious student who correctly solves a multi-step rotational dynamics problem but finds their answer marked wrong may begin doubting their conceptual understanding, especially close to a competitive examination.

### Wasted Time and Misplaced Revision

Students may spend hours second-guessing valid steps, repeatedly solving an unsolvable question, or searching for a missing diagram such as the one reported in R025. This takes time away from genuine learning gaps and productive revision.

### Institutional Erosion

Faculty lose valuable teaching time responding to repetitive complaints instead of addressing conceptual doubts. When students stop trusting question keys and solutions, their trust in the testing platform itself deteriorates.

The Report → Fix system aims to reduce this harm by turning student reports into traceable investigations, evidence-backed findings, and controlled faculty decisions.

---

## 2. What Must AI Never Auto-Apply?

The governing principle is:

**AI proposes. Deterministic code validates. Faculty controls.**

AI is an investigative assistant, not an authority that can silently change academic content or student scores.

The following categories must never be automatically applied without explicit faculty approval.

### 2.1 Human-Only Taxonomy Repairs (`auto: false`)

The following repair types require subject-matter or editorial judgment:

- **`diagram`** — AI must not fabricate missing figures, circuit diagrams, or other visual information.
- **`identical_options`** — Replacing duplicate distractors requires pedagogical judgment and subject expertise.
- **`wrong_question`** — A fundamentally incorrect or mismatched question may need retirement or complete rewriting rather than a small edit.
- **`unsound`** — A question without a mathematically or scientifically valid answer requires faculty assessment.
- **`syllabus`** — Curriculum inclusion or exclusion is an academic policy decision.
- **`wrong_chapter`** — Chapter alignment must be confirmed by faculty familiar with the relevant examination syllabus.

These categories must remain human-controlled regardless of AI confidence.

### 2.2 High-Stakes Answer-Key Modifications (`answer_key`)

Changing an official answer key can alter past student scores, percentiles, rankings, and leaderboard positions.

Even when the taxonomy marks `answer_key` as eligible for automated consideration, **no answer-key modification may be applied without independent mathematical or scientific verification and explicit faculty approval**.

Independent verification strengthens the evidence; it never replaces faculty sign-off.

The system must preserve the original answer key until the authorized faculty decision is completed. It must also retain an auditable record of the proposed change and the final decision.

### 2.3 Ambiguous or Unverifiable Questions

When confidence is below the configured threshold of 0.90, or when important assumptions remain uncertain, the system must not silently overwrite academic content.

Uncertainty must be visible to the reviewer. The case should be routed for faculty review, further investigation, or a decision that no correction can safely be made.

A confidence score is supporting evidence, not proof of correctness.

### 2.4 Prompt-Injection and Untrusted Student Input

Student comments and report descriptions are untrusted data.

A student comment may contain instructions intended to override the system, manipulate an answer key, or change the investigation result. Such text must never be treated as an instruction to the AI investigator.

The system must independently inspect the original question and its academic evidence. Suspicious instructions should be identified and quarantined without allowing them to influence the investigation.

### 2.5 Governance Principle

A proposed edit is not an applied edit.

The system must distinguish between:

1. AI investigation and recommendation.
2. Deterministic validation and safety checks.
3. Faculty review and approval.
4. Any subsequent authorized application of a correction.

A finding may be classified as a defect while still being unsafe to apply automatically.

---

## 3. The Week-One Operational Metric

**Metric Name: Faculty Decision Latency per High-Velocity Defect (FDL-90)**

### Definition

FDL-90 measures the median elapsed time, in hours, between the second student report for a question and the final faculty decision to approve or reject the proposed correction.

\[
\text{FDL-90} =
\operatorname{Median}
\left(
\text{Faculty decision time}
-
\text{Timestamp of second student report}
\right)
\]

Only cases with a recorded second report and a final faculty decision should contribute to the calculation.

Cases that have not yet received a final decision should remain visible as pending and should not be treated as completed decisions.

### What It Measures

The metric measures the operational responsiveness of the report-investigation-review loop for questions attracting repeated student complaints.

It captures the time students remain exposed to a potentially defective question while the platform investigates and resolves the issue.

### Why It Matters

Total report volume and raw AI processing time do not reveal how quickly a real academic defect is resolved.

A question may continue affecting students every time it appears in a test. Reducing the time between repeated reports and faculty sign-off helps limit the period during which that defect remains unresolved.

### Week-One Target

A proposed operational target is to reduce median FDL-90 to under four hours during the first week.

This is a target for operational measurement, not a claim about an already achieved result.

---

## 4. One Idea Beyond the Brief: Defect Blast-Radius Auto-Regrading

### Concept

A retrospective score-adjustment and proactive student-notification pipeline connected to approved faculty corrections.

### User Value

When faculty approve an answer-key correction, the platform could identify students whose previous mock-test scores were affected by the incorrect key.

For example, if an official answer key changes from C to B, the system could examine relevant test submissions from the previous 30 days and calculate which students were incorrectly penalized or credited.

This could help Acadza demonstrate accountability and restore student trust after a content defect.

### Proposed Implementation Direction

1. **Approval trigger:** Start the workflow only after an authorized faculty member approves an answer-key correction.
2. **Impact analysis:** Query historical test-submission records using the affected `questionId`.
3. **Score recalculation:** Recalculate only the impacted submissions using the approved key and the applicable marking scheme.
4. **Audit trail:** Record the previous score, recalculated score, correction reference, approval identity, and timestamp.
5. **Notification:** Prepare personalized notifications for affected students.
6. **Verification:** Ensure that score and rank updates are consistent before notifying students.

### Example Notification

> We investigated a defect flagged on Question #60f744 and approved a correction to the official answer key. Your test score has been recalculated. Thank you for helping us improve question quality.

The actual score change must be calculated from verified submission data. The example above is illustrative and must not be presented as a real student notification.

### Scope and Safety

**This is a proposed future capability, not a claim that the current implementation performs automatic regrading or student notifications.**

It would require access to historical test-submission data, an approved correction workflow, reliable score recalculation, audit logging, and safeguards against duplicate or incorrect updates.

The system must never change historical scores merely because an AI investigation recommends a correction. Faculty approval and verified recalculation are mandatory.

---

## Product Principle

The Report → Fix system is designed to make academic content investigations faster, more transparent, and more accountable.

Its central promise is not that AI can make every academic decision. It is that AI can help faculty identify what may be wrong, understand the supporting evidence, and make a well-informed decision without sacrificing academic integrity or student trust.