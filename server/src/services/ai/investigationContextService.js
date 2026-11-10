const Question = require('../../models/Question');
const Report = require('../../models/Report');
const Taxonomy = require('../../models/Taxonomy');
const InvestigationCase = require('../../models/InvestigationCase');

/**
 * Investigation Context Service
 * Retrieves and constructs a comprehensive, sanitized academic investigation
 * context object for an investigation case without altering underlying data.
 */
class InvestigationContextService {
  /**
   * Build complete context for an investigation case by caseId or questionId
   * @param {string} caseIdentifier - caseId (e.g. 'CASE_60f744b3f1b9bc7cc7b4a949') or questionId
   */
  async buildContext(caseIdentifier) {
    let invCase = await InvestigationCase.findOne({ caseId: caseIdentifier }).lean();
    if (!invCase) {
      invCase = await InvestigationCase.findOne({ questionId: caseIdentifier }).lean();
    }

    if (!invCase) {
      throw new Error(`Investigation case not found for identifier: ${caseIdentifier}`);
    }

    // Retrieve original question
    const question = await Question.findById(invCase.questionId).lean();
    if (!question) {
      throw new Error(`Referenced question ${invCase.questionId} not found in database.`);
    }

    // Retrieve taxonomy rules
    const taxonomy = await Taxonomy.findById('acadza_taxonomy_v1').lean();

    // Extract type-specific question structure
    const qType = question.questionType;
    const typePayload = question[qType] || {};

    const qHtml = typePayload.question || '';
    const solutionHtml = typePayload.solution || '';
    const answerKey = typePayload.answer;

    // Build sanitized untrusted reports list
    const studentReports = (invCase.reports || []).map(r => ({
      reportId: r.reportId,
      studentId: r.studentId,
      source: r.source,
      comment: r.comment || '',
      reportedAt: r.reportedAt,
      injectionDetected: !!r.injectionRisk?.injectionDetected,
      injectionRiskLevel: r.injectionRisk?.riskLevel || 'none'
    }));

    return {
      caseId: invCase.caseId,
      questionId: invCase.questionId,
      status: invCase.status,
      reportCount: invCase.reportCount,
      firstReportedAt: invCase.firstReportedAt,
      lastReportedAt: invCase.lastReportedAt,
      questionMetadata: {
        qid: question.qid,
        questionType: qType,
        subject: question.subject,
        chapter: question.chapter,
        concept: question.concept,
        subConcept: question.subConcept,
        level: question.level
      },
      content: {
        questionHtml: qHtml,
        solutionHtml: solutionHtml,
        storedAnswer: answerKey
      },
      errorHistory: question.errorHistory || [],
      studentReports,
      injectionAnalysis: invCase.injectionAnalysis || {
        injectionDetected: false,
        riskLevel: 'none'
      },
      taxonomyRules: {
        verdicts: taxonomy?.verdicts || {},
        repairs: taxonomy?.repairs || {}
      }
    };
  }
}

module.exports = new InvestigationContextService();

