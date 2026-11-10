const express = require('express');
const Question = require('../../models/Question');
const Report = require('../../models/Report');
const InvestigationCase = require('../../models/InvestigationCase');
const Taxonomy = require('../../models/Taxonomy');

const router = express.Router();

/**
 * GET /api/overview/stats
 * Aggregates real operational metrics directly from MongoDB.
 * Never invents numbers or injects synthetic statistics.
 */
router.get('/overview/stats', async (req, res) => {
  try {
    const [
      totalQuestions,
      totalReports,
      allCases,
      taxonomyDoc
    ] = await Promise.all([
      Question.countDocuments(),
      Report.countDocuments(),
      InvestigationCase.find({}).sort({ lastReportedAt: -1 }).lean(),
      Taxonomy.findById('acadza_taxonomy_v1').lean()
    ]);

    const totalCases = allCases.length;

    // Status breakdown based on actual stored investigation cases
    const statusDistribution = {};
    let casesAwaitingFacultyReview = 0;
    let highPriorityCount = 0; // multi-report questions or adversarial injections

    allCases.forEach(c => {
      statusDistribution[c.status] = (statusDistribution[c.status] || 0) + 1;
      
      if (c.status === 'needs_faculty_review') {
        casesAwaitingFacultyReview++;
      }

      // High priority: 2+ reports or prompt injection detected
      if (c.reportCount > 1 || c.injectionAnalysis?.injectionDetected) {
        highPriorityCount++;
      }
    });

    // Recent investigation activity: top 6 most recent cases
    const recentActivity = allCases.slice(0, 6).map(c => ({
      caseId: c.caseId,
      questionId: c.questionId,
      reportCount: c.reportCount,
      status: c.status,
      subject: c.questionSnapshot?.subject || 'JEE',
      chapter: c.questionSnapshot?.chapter || 'General',
      lastReportedAt: c.lastReportedAt,
      firstReportedAt: c.firstReportedAt,
      injectionDetected: !!c.injectionAnalysis?.injectionDetected,
      latestComment: c.reports[0]?.comment || ''
    }));

    // High priority cases list
    const highPriorityCases = allCases
      .filter(c => c.reportCount > 1 || c.injectionAnalysis?.injectionDetected)
      .slice(0, 5)
      .map(c => ({
        caseId: c.caseId,
        questionId: c.questionId,
        reportCount: c.reportCount,
        status: c.status,
        chapter: c.questionSnapshot?.chapter || 'General',
        injectionDetected: !!c.injectionAnalysis?.injectionDetected,
        lastReportedAt: c.lastReportedAt
      }));

    return res.json({
      success: true,
      stats: {
        totalQuestions,
        totalReports,
        openInvestigationCases: totalCases,
        casesAwaitingFacultyReview,
        highPriorityCasesCount: highPriorityCount,
        statusDistribution,
        taxonomyLoaded: !!taxonomyDoc
      },
      highPriorityCases,
      recentActivity
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve overview statistics',
      error: err.message
    });
  }
});

module.exports = router;

