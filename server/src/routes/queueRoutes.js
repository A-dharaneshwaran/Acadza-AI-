const express = require('express');
const InvestigationCase = require('../../models/InvestigationCase');
const Question = require('../../models/Question');
const Taxonomy = require('../../models/Taxonomy');

const router = express.Router();

/**
 * GET /api/cases/paginated
 * Query parameters:
 *  - page: number (default 1)
 *  - limit: number (default 10)
 *  - search: string (matches caseId, questionId, chapter, subject, or student comment)
 *  - status: string (filter by status)
 *  - priority: 'all' | 'high' | 'multi' | 'injection'
 *  - sortBy: 'urgency' | 'recent' | 'reportCount' | 'subject'
 *  - sortOrder: 'asc' | 'desc'
 */
router.get('/cases/paginated', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10));
    const search = (req.query.search || '').trim();
    const statusFilter = req.query.status;
    const priorityFilter = req.query.priority;
    const sortBy = req.query.sortBy || 'urgency';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build Mongoose filter
    const query = {};

    if (statusFilter && statusFilter !== 'all') {
      query.status = statusFilter;
    }

    if (priorityFilter === 'injection') {
      query['injectionAnalysis.injectionDetected'] = true;
    } else if (priorityFilter === 'multi') {
      query.reportCount = { $gt: 1 };
    } else if (priorityFilter === 'high') {
      query.$or = [
        { reportCount: { $gt: 1 } },
        { 'injectionAnalysis.injectionDetected': true }
      ];
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { caseId: searchRegex },
        { questionId: searchRegex },
        { 'questionSnapshot.subject': searchRegex },
        { 'questionSnapshot.chapter': searchRegex },
        { 'reports.comment': searchRegex }
      ];
    }

    // Determine sort specification
    let sortSpec = {};
    if (sortBy === 'recent') {
      sortSpec = { lastReportedAt: sortOrder };
    } else if (sortBy === 'reportCount') {
      sortSpec = { reportCount: sortOrder, lastReportedAt: -1 };
    } else if (sortBy === 'subject') {
      sortSpec = { 'questionSnapshot.subject': sortOrder, lastReportedAt: -1 };
    } else {
      // Default: Urgency (highest report count first, then most recently reported)
      sortSpec = { reportCount: -1, lastReportedAt: -1 };
    }

    const total = await InvestigationCase.countDocuments(query);
    const cases = await InvestigationCase.find(query)
      .sort(sortSpec)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Map enriched presentation items
    const items = cases.map(c => ({
      caseId: c.caseId,
      questionId: c.questionId,
      subject: c.questionSnapshot?.subject || 'JEE Academic',
      chapter: c.questionSnapshot?.chapter || 'General',
      questionType: c.questionSnapshot?.questionType || 'scq',
      reportCount: c.reportCount,
      status: c.status,
      aiVerdict: c.triageResult?.verdict || c.aiTriage?.verdict || null,
      aiConfidence: c.triageResult?.confidence || c.aiTriage?.confidence || null,
      priority: (c.reportCount > 1 || c.injectionAnalysis?.injectionDetected) ? 'High' : 'Normal',
      injectionDetected: !!c.injectionAnalysis?.injectionDetected,
      firstReportedAt: c.firstReportedAt,
      lastReportedAt: c.lastReportedAt,
      representativeComment: c.reports[0]?.comment || ''
    }));

    return res.json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
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

