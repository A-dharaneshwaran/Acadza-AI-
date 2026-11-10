const reportIntakeService = require('./reportIntakeService');
const duplicateGroupingService = require('./duplicateGroupingService');
const injectionDetectionService = require('./injectionDetectionService');
const Question = require('../../models/Question');
const InvestigationCase = require('../../models/InvestigationCase');

/**
 * Case Generation Service
 * Groups incoming reports by questionId, executes prompt injection analysis,
 * extracts contextual snapshots from referenced questions, and creates/updates
 * unified InvestigationCase documents idempotently.
 */
class CaseGenerationService {
  /**
   * Process all reports currently in MongoDB and generate/update investigation cases.
   * @returns {Object} Execution summary and metrics
   */
  async generateCases() {
    const rawReports = await reportIntakeService.getAllReports();
    if (!rawReports || rawReports.length === 0) {
      return {
        casesCreated: 0,
        casesUpdated: 0,
        totalCases: 0,
        totalReports: 0,
        message: 'No reports found to process'
      };
    }

    // 1. Group reports by questionId
    const groups = duplicateGroupingService.groupByQuestion(rawReports);

    // 2. Fetch all corresponding questions
    const questionIds = groups.map(g => g.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } }).lean();
    const questionMap = new Map(questions.map(q => [q._id, q]));

    let createdCount = 0;
    let updatedCount = 0;
    const generatedCases = [];

    for (const group of groups) {
      const question = questionMap.get(group.questionId);
      const caseId = `CASE_${group.questionId}`;

      // Evaluate prompt injection risk across all reports in this question group
      const enrichedReports = group.reports.map(rep => {
        const detection = injectionDetectionService.detect(rep.comment);
        return {
          reportId: rep.reportId,
          studentId: rep.studentId,
          source: rep.source,
          comment: rep.comment,
          reportedAt: rep.reportedAt,
          injectionRisk: detection
        };
      });

      const groupInjectionEval = injectionDetectionService.evaluateGroup(
        group.reports.map(r => ({ reportId: r.reportId, comment: r.comment }))
      );

      const caseData = {
        caseId,
        questionId: group.questionId,
        reportIds: group.reportIds,
        reportCount: group.totalReportCount,
        reports: enrichedReports,
        firstReportedAt: group.firstReportedAt,
        lastReportedAt: group.lastReportedAt,
        questionSnapshot: question ? {
          questionType: question.questionType,
          subject: question.subject,
          chapter: question.chapter,
          concept: question.concept,
          subConcept: question.subConcept,
          level: question.level,
          hasErrorHistory: !!(question.errorHistory && question.errorHistory.length > 0)
        } : {
          questionType: 'unknown',
          hasErrorHistory: false
        },
        errorHistoryContext: question?.errorHistory || [],
        injectionAnalysis: {
          injectionDetected: groupInjectionEval.injectionDetected,
          riskLevel: groupInjectionEval.riskLevel,
          summary: groupInjectionEval.injectionDetected
            ? `Detected potential prompt injection in one or more student reports for this question.`
            : `All reports standard user feedback.`
        },
        status: 'ready_for_ai'
      };

      // Idempotent upsert of the investigation case
      const existing = await InvestigationCase.findOne({ questionId: group.questionId });
      if (!existing) {
        await InvestigationCase.create(caseData);
        createdCount++;
      } else {
        // Keep existing status if it has already progressed, update reports, activity & injection
        await InvestigationCase.updateOne(
          { questionId: group.questionId },
          {
            $set: {
              reportIds: caseData.reportIds,
              reportCount: caseData.reportCount,
              reports: caseData.reports,
              firstReportedAt: caseData.firstReportedAt,
              lastReportedAt: caseData.lastReportedAt,
              questionSnapshot: caseData.questionSnapshot,
              errorHistoryContext: caseData.errorHistoryContext,
              injectionAnalysis: caseData.injectionAnalysis
            }
          }
        );
        updatedCount++;
      }

      generatedCases.push(caseData);
    }

    const totalCases = await InvestigationCase.countDocuments();

    return {
      casesCreated: createdCount,
      casesUpdated: updatedCount,
      totalCases,
      totalReports: rawReports.length,
      groupedQuestionCount: groups.length,
      generatedCases
    };
  }
}

module.exports = new CaseGenerationService();

