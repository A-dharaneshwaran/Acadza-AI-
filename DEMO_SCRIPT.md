# ACADZA — PRODUCT DEMONSTRATION

## Overview

This document outlines the product demonstration of **Acadza — AI-Powered Report-to-Fix Quality Assurance Engine**, developed to streamline the identification, investigation, and resolution of student-reported errors in JEE and NEET academic content.

The demonstration showcases the live application, its core functionality, investigation workflow, and faculty-controlled decision-making process.

## Live Application

**Frontend:** https://acadza-frontend-delta.vercel.app

**Backend:** https://acadza-backend-4m0q.onrender.com

**Backend Health Check:** https://acadza-backend-4m0q.onrender.com/api/health

**Technology Stack:**
- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express.js
- Database: MongoDB Atlas
- Deployment: Vercel and Render
- AI Integration: NVIDIA NIM API integration (optional; requires configuration)

## Demonstration Walkthrough

### 1. Introduction

The demonstration begins with an introduction to Acadza and the problem it addresses.

Students frequently report issues in academic questions, including incorrect answer keys, missing information, unclear explanations, and formatting errors.

Acadza provides a structured system to organize these reports, investigate potential defects, propose corrections, and support faculty review.

### 2. Overview Dashboard

The Overview Dashboard provides a centralized summary of the platform's operational data.

The deployed application contains:

- **43 questions**
- **44 student reports**
- **39 investigation cases**

The dashboard presents investigation statistics, priority information, and other operational indicators.

These records are retrieved from MongoDB Atlas rather than hardcoded demonstration data.

### 3. Investigation Queue

The Investigation Queue organizes reported issues into cases for faculty review.

Related student reports are grouped to reduce duplicate investigations and help identify recurring problems.

The interface allows faculty to explore cases, examine their priority and status, and navigate to detailed investigations.

### 4. Investigation Workspace

The Investigation Workspace is the central feature of Acadza.

For each investigation, faculty can examine:

- A summary of the reported issue.
- Original student complaints.
- The associated academic question.
- The official answer and explanation.
- Investigation findings and supporting reasoning.
- Proposed corrections.
- Before-and-after comparisons.

This structure makes it easier to understand the reported problem, evaluate the evidence, and determine whether a correction is justified.

### 5. Proposed Corrections and Evidence

Acadza presents structured correction proposals for issues identified during investigation.

Rather than replacing entire questions unnecessarily, the system supports targeted modifications to the relevant content.

The before-and-after comparison helps faculty understand the exact proposed change.

Supporting evidence and investigation reasoning are displayed to make recommendations transparent and reviewable.

### 6. Faculty Review and Human Oversight

Human oversight is a central design principle of Acadza.

Faculty can inspect investigation findings and evaluate proposed corrections before making decisions.

Sensitive changes, particularly answer-key corrections, require explicit faculty approval.

The platform is designed to assist faculty rather than independently publish every AI-generated recommendation.

### 7. Technology and Deployment

Acadza is implemented using a full-stack JavaScript architecture.

The React frontend communicates with a Node.js and Express backend, which retrieves investigation and academic records from MongoDB Atlas.

The application is deployed publicly using Vercel for frontend hosting and Render for backend hosting.

The production health endpoint confirms database connectivity and provides operational status information.

### 8. Conclusion

Acadza demonstrates an evidence-driven approach to academic quality assurance.

By combining report grouping, structured investigations, targeted correction proposals, and faculty-controlled review, the platform aims to reduce manual investigation effort while maintaining transparency and academic accuracy.

The overall objective is to help faculty identify genuine content issues more efficiently and make informed decisions based on clear supporting evidence.

---

## Demonstration Resources

**Live Application:**  
https://acadza-frontend-delta.vercel.app

**GitHub Repository:**  
https://github.com/A-dharaneshwaran/Acadza-AI-

**Demo Video:**  
https://drive.google.com/file/d/1GTd6icWJWa1N8y9LKXqb3K4M1GmFOgaO/view?usp=drive_link

---

## Implementation Notes

- The application uses the supplied academic dataset.
- Original question and report records are preserved.
- Related reports are organized into investigation cases.
- Correction proposals are presented for faculty evaluation.
- Sensitive academic corrections require human oversight.
- NVIDIA inference integration is available in the codebase but requires valid production API credentials for live execution.
- Render's free hosting tier may introduce startup delays after inactivity.

**Project Status:** Deployed and accessible, with the core faculty investigation workflow implemented.