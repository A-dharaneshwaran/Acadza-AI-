const express = require('express');
const InvestigationCase = require('../models/InvestigationCase');
const Question = require('../models/Question');
const Taxonomy = require('../models/Taxonomy');
const ReportInvestigation = require('../models/ReportInvestigation');

const router = express.Router();

/**
 * Standardized Faculty Review Classifier
 * Computes exact review category based on live findings, safety flags, and faculty decisions:
 * - 'Review Completed': A valid faculty decision has been officially recorded.
 * - 'Needs Review': Pending human review requirement, security prompt injection flag, or non-auto-eligible defect.
 * - 'No Review Needed': Clean finding (no_error / already_fixed / app_issue / etc.) or safe auto-eligible defect without pending review.
 */
function classifyCaseReviewStatus(c, invList = []) {
  // 1. Review Completed: explicit faculty decision recorded on any finding
  const hasCompletedDecision = invList.some(i => i.facultyDecision && i.facultyDecision.decision);
  if (hasCompletedDecision) {
    return 'Review Completed';
  }

  // 2. Security flag: Prompt injection detected in case or any finding
  const hasInjection = !!(c.injectionAnalysis && c.injectionAnalysis.injectionDetected) ||
                       invList.some(i => i.injectionDetected);
  if (hasInjection) {
    return 'Needs Review';
  }

  // 3. High-stakes answer_key change
  const hasAnswerKeyDefect = invList.some(i => i.repairType === 'answer_key');
  if (hasAnswerKeyDefect) {
    return 'Needs Review';
  }

  // 4. Defects that cannot be safely auto-applied or require human review
  const hasHumanDefect = invList.some(i => i.verdict === 'defect' && !i.safeToApply);
  if (hasHumanDefect) {
    return 'Needs Review';
  }

  // 5. Defects with confidence < 0.95 or explicit uncertainties
  const hasUncertainDefect = invList.some(i => 
    i.verdict === 'defect' && ((i.confidence || 0) < 0.95 || (i.uncertainties && i.uncertainties.length > 0))
  );
  if (hasUncertainDefect) {
    return 'Needs Review';
  }

  // Fallback for cases without persisted findings: check case status
  if (invList.length === 0) {
    if (c.status === 'faculty_reviewed' || c.status === 'resolved') return 'Review Completed';
    if (c.status === 'needs_faculty_review') return 'Needs Review';
    return 'No Review Needed';
  }

  // Clean / auto-eligible findings require no review
  return 'No Review Needed';
}

/**
 * GET /api/cases/paginated
 * Query parameters:
 *  - page: number (default 1)
 *  - limit: number (default 8)
 *  - search: string
 *  - facultyReview: 'all' | 'needs_review' | 'no_review_needed' | 'review_completed'
 *  - findingType: 'all' | 'defect' | 'no_error' | 'display_issue' | 'app_issue' | 'language_mode' | 'already_fixed' | 'not_actionable'
 *  - sortBy: 'urgency' | 'newest' | 'oldest' | 'highest_confidence' | 'lowest_confidence'
 *  - status: string (legacy support)
 *  - priority: string (legacy support)
 */
router.get('/cases/paginated', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 8));
    const search = (req.query.search || '').trim();
    
    // Faculty-oriented filters
    const facultyReview = (req.query.facultyReview || 'all').toLowerCase();
    const findingType = (req.query.findingType || 'all').toLowerCase();
    const sortBy = (req.query.sortBy || 'urgency').toLowerCase();

    // Legacy fallback support
    const statusFilter = req.query.status;
    const priorityFilter = req.query.priority;

    // Fetch all cases and all ReportInvestigation documents to build live relational index
    const [allCases, allInvestigations] = await Promise.all([
      InvestigationCase.find({}).lean(),
      ReportInvestigation.find({}).lean()
    ]);

    // Build map of investigations by caseId, questionId
    const investigationsByCaseId = new Map();
    for (const inv of allInvestigations) {
      if (inv.caseId) {
        if (!investigationsByCaseId.has(inv.caseId)) investigationsByCaseId.set(inv.caseId, []);
        investigationsByCaseId.get(inv.caseId).push(inv);
      }
      if (inv.questionId) {
        const altCaseKey = `CASE_${inv.questionId}`;
        if (!investigationsByCaseId.has(altCaseKey)) investigationsByCaseId.set(altCaseKey, []);
        if (inv.caseId !== altCaseKey) {
          investigationsByCaseId.get(altCaseKey).push(inv);
        }
      }
    }

    // 1. Calculate live summary review counts across ALL cases using identical classifier
    let summaryNeedsReview = 0;
    let summaryNoReviewNeeded = 0;
    let summaryReviewCompleted = 0;

    for (const c of allCases) {
      const invList = investigationsByCaseId.get(c.caseId) || [];
      const status = classifyCaseReviewStatus(c, invList);
      if (status === 'Needs Review') summaryNeedsReview++;
      else if (status === 'No Review Needed') summaryNoReviewNeeded++;
      else if (status === 'Review Completed') summaryReviewCompleted++;
    }

    const reviewSummary = {
      needsReview: summaryNeedsReview,
      noReviewNeeded: summaryNoReviewNeeded,
      reviewCompleted: summaryReviewCompleted,
      totalCases: allCases.length
    };

    // 2. Filter cases based on search and parameters
    const filteredCases = allCases.filter(c => {
      const invList = investigationsByCaseId.get(c.caseId) || [];
      const reviewStatus = classifyCaseReviewStatus(c, invList);

      // A. Search filter
      if (search) {
        const term = search.toLowerCase();
        const matchesId = (c.caseId || '').toLowerCase().includes(term);
        const matchesQid = (c.questionId || '').toLowerCase().includes(term);
        const matchesSubject = (c.questionSnapshot?.subject || '').toLowerCase().includes(term);
        const matchesChapter = (c.questionSnapshot?.chapter || '').toLowerCase().includes(term);
        const matchesComment = (c.reports || []).some(r => (r.comment || '').toLowerCase().includes(term));
        const matchesEvidence = invList.some(i => (i.evidence || '').toLowerCase().includes(term));

        if (!matchesId && !matchesQid && !matchesSubject && !matchesChapter && !matchesComment && !matchesEvidence) {
          return false;
        }
      }

      // B. Faculty Review Filter
      if (facultyReview === 'needs_review' && reviewStatus !== 'Needs Review') return false;
      if (facultyReview === 'no_review_needed' && reviewStatus !== 'No Review Needed') return false;
      if (facultyReview === 'review_completed' && reviewStatus !== 'Review Completed') return false;

      // C. Finding Type Filter (Taxonomy verdict)
      if (findingType !== 'all') {
        const caseVerdicts = new Set(invList.map(i => (i.verdict || '').toLowerCase()));
        if (c.triageResult?.verdict) caseVerdicts.add(c.triageResult.verdict.toLowerCase());
        if (c.aiTriage?.verdict) caseVerdicts.add(c.aiTriage.verdict.toLowerCase());

        if (!caseVerdicts.has(findingType)) {
          return false;
        }
      }

      // D. Legacy Priority Filter
      if (priorityFilter === 'injection' && !c.injectionAnalysis?.injectionDetected) return false;
      if (priorityFilter === 'multi' && c.reportCount <= 1) return false;
      if (priorityFilter === 'high' && c.reportCount <= 1 && !c.injectionAnalysis?.injectionDetected) return false;

      // E. Legacy Status Filter
      if (statusFilter && statusFilter !== 'all' && c.status !== statusFilter) return false;

      return true;
    });

    // 3. Sort filtered cases
    filteredCases.sort((a, b) => {
      const invListA = investigationsByCaseId.get(a.caseId) || [];
      const invListB = investigationsByCaseId.get(b.caseId) || [];

      const confA = invListA.length > 0 
        ? Math.max(...invListA.map(i => i.confidence || 0)) 
        : (a.triageResult?.confidence || a.aiTriage?.confidence || 0);
      const confB = invListB.length > 0 
        ? Math.max(...invListB.map(i => i.confidence || 0)) 
        : (b.triageResult?.confidence || b.aiTriage?.confidence || 0);

      const dateA = new Date(a.firstReportedAt || a.lastReportedAt || 0).getTime();
      const dateB = new Date(b.firstReportedAt || b.lastReportedAt || 0).getTime();

      if (sortBy === 'newest') {
        return dateB - dateA;
      }
      if (sortBy === 'oldest') {
        return dateA - dateB;
      }
      if (sortBy === 'highest_confidence') {
        if (confB !== confA) return confB - confA;
        return (b.reportCount || 1) - (a.reportCount || 1);
      }
      if (sortBy === 'lowest_confidence') {
        if (confA !== confB) return confA - confB;
        return (b.reportCount || 1) - (a.reportCount || 1);
      }
      
      // Default: 'urgency'
      const urgencyA = (a.reportCount > 1 ? 10 : 0) + (a.injectionAnalysis?.injectionDetected ? 10 : 0);
      const urgencyB = (b.reportCount > 1 ? 10 : 0) + (b.injectionAnalysis?.injectionDetected ? 10 : 0);
      if (urgencyB !== urgencyA) return urgencyB - urgencyA;

      if ((b.reportCount || 1) !== (a.reportCount || 1)) {
        return (b.reportCount || 1) - (a.reportCount || 1);
      }
      return dateB - dateA;
    });

    // 4. Paginate
    const total = filteredCases.length;
    const paginated = filteredCases.slice((page - 1) * limit, page * limit);

    // Map enriched presentation items
    const items = paginated.map(c => {
      const invList = investigationsByCaseId.get(c.caseId) || [];
      const primaryInv = invList[0] || null;
      const reviewStatus = classifyCaseReviewStatus(c, invList);

      return {
        caseId: c.caseId,
        questionId: c.questionId,
        subject: c.questionSnapshot?.subject || 'JEE Academic',
        chapter: c.questionSnapshot?.chapter || 'General',
        questionType: c.questionSnapshot?.questionType || 'scq',
        reportCount: c.reportCount,
        status: c.status,
        aiVerdict: primaryInv ? primaryInv.verdict : (c.triageResult?.verdict || c.aiTriage?.verdict || null),
        aiConfidence: primaryInv ? primaryInv.confidence : (c.triageResult?.confidence || c.aiTriage?.confidence || null),
        repairType: primaryInv ? primaryInv.repairType : (c.triageResult?.repairType || c.aiTriage?.repairType || null),
        requiresFacultyReview: reviewStatus === 'Needs Review',
        reviewStatus: reviewStatus,
        priority: (c.reportCount > 1 || c.injectionAnalysis?.injectionDetected) ? 'High' : 'Normal',
        injectionDetected: !!c.injectionAnalysis?.injectionDetected || invList.some(i => i.injectionDetected),
        firstReportedAt: c.firstReportedAt,
        lastReportedAt: c.lastReportedAt,
        representativeComment: c.reports[0]?.comment || '',
        investigationsCount: invList.length
      };
    });

    return res.json({
      success: true,
      reviewSummary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      },
      items
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve paginated cases',
      error: err.message
    });
  }
});

module.exports = router;
