# PRODUCT ANALYSIS: THE REPORT → FIX SYSTEM

### 1. Who Loses the Most?
In Acadza's ecosystem serving ~8 lakh students across India, **the serious, borderline JEE/NEET aspirant loses the most**. 

In high-stakes exams where a single question (4 marks) determines whether a student secures an MBBS seat or an IIT engineering branch versus dropping another year, broken content inflicts compounded harm:
- **Confidence Destruction**: An ambitious 17-year-old student who solves a multi-step rotational dynamics problem correctly but finds their answer marked wrong begins doubting their core conceptual foundation right before competitive exams.
- **Wasted Time & Misplaced Revision**: The student spends hours second-guessing valid steps, re-solving an unsolvable stem, or attempting to locate non-existent diagrams (`R025`), diverting revision away from genuine weak topics.
- **Institutional Erosion**: Coaching faculty lose teaching momentum answering repetitive, confused complaints rather than addressing conceptual doubts. When students lose trust in question keys, they lose trust in the testing platform itself.

---

### 2. What Must AI Never Auto-Apply?
AI must act strictly as an investigative advisor (**"AI proposes, deterministic code validates, faculty controls"**). The following categories must **NEVER** be auto-applied without human faculty sign-off:

1. **Human-Only Taxonomy Repairs (`auto: false`)**:
   - `diagram`: The AI cannot authoritatively draw or fabricate missing figures or circuit diagrams.
   - `identical_options`: Replacing duplicate distractors requires pedagogical subject-matter authoring.
   - `wrong_question` & `unsound`: Questions that lack a mathematically valid answer or pair a disjoint solution cannot be resolved by an edit; they require retirement or complete rewrite by faculty.
   - `syllabus` & `wrong_chapter`: Curriculum alignment decisions (e.g. NEET vs JEE Main exclusions) are editorial policy decisions requiring senior faculty confirmation.
2. **High-Stakes Answer-Key Modifications (`answer_key`)**:
   - Changing official keys directly alters past student scoring, percentiles, and leaderboard rankings. Even when `auto: true` in taxonomy, any change to `answer` must require dual-factor validation and human review unless independent mathematical solves prove the key unequivocally.
3. **Ambiguous or Unverifiable Questions**:
   - When confidence is below threshold (<0.90) or uncertainties exist in assumptions, silent automatic overwrites risk propagating an AI hallucination into production.

---

### 3. The Week-One Operational Metric
**Metric Name**: **Faculty Decision Latency per High-Velocity Defect (FDL-90)**

- **Definition & Calculation**:
  $$\text{FDL-90} = \text{Median time elapsed (in hours) between the 2nd student report for a question and final Faculty sign-off (Approve / Reject)}.$$
- **What It Measures**: The end-to-end operational responsiveness of the triage loop on questions causing active student friction.
- **Why It Matters**: Tracking total reports or raw AI processing time is insufficient. Broken questions continuously penalize every student who encounters them until fixed. If FDL-90 drops from days to under 4 hours in Week 1, the platform successfully halts defect compounding before hundreds of students encounter the broken item.

---

### 4. One Idea Beyond the Brief: "Defect Blast-Radius Auto-Regrading"
**Concept**: A retrospective score-adjustment and proactive notification pipeline linked to faculty approvals.

- **User Value**: When faculty approve an `answer_key` correction (e.g. switching key from C to B), the system calculates the "blast radius"—every student who was penalized or miscredited during mock tests over the past 30 days.
- **Implementation Direction**:
  - The backend queries the test-submission log for `questionId`, automatically recalculates the impacted scores, and issues an automated, personalized notification to affected students: *"We investigated a defect flagged on Question #60f744 and corrected the official answer key to (B). Your test score and rank have been updated (+5 marks). Thank you for your diligence."*
  - This turns an embarrassing platform defect into an active trust-building moment, proving to students and parents that Acadza relentlessly respects their effort.

