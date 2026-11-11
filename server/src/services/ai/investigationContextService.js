const Question = require('../../models/Question');
const InvestigationCase = require('../../models/InvestigationCase');
const Taxonomy = require('../../models/Taxonomy');

/**
 * Investigation Context Service (Token-Optimized v3.0)
 *
 * Prepares accurate, minimal, high-signal investigation context for NVIDIA NIM.
 * Prunes redundant whitespace, empty arrays, and extraneous metadata while
 * strictly preserving:
 *  - Essential question stem & inline MathML formulas
 *  - Full option choices and answer key
 *  - Supplied solution steps
 *  - Relevant errorHistory
 *  - Individual student claims & injection flags
 */
class InvestigationContextService {
  /**
   * Build complete token-optimized context for a case.
   */
  async buildContext(caseIdentifier) {
    let invCase = await InvestigationCase.findOne({ caseId: caseIdentifier }).lean();
    if (!invCase) {
      invCase = await InvestigationCase.findOne({ questionId: caseIdentifier }).lean();
    }

    if (!invCase) {
      throw new Error(`Investigation case not found for identifier: ${caseIdentifier}`);
    }

    const question = await Question.findById(invCase.questionId).lean();
    if (!question) {
      throw new Error(`Referenced question ${invCase.questionId} not found in database.`);
    }

    const taxonomy = await Taxonomy.findById('acadza_taxonomy_v1').lean();

    const qType = question.questionType;
    const typePayload = question[qType] || {};

    // Token optimization: Clean extra HTML whitespace without breaking MathML tags
    const qHtml = (typePayload.question || '').replace(/\s+/g, ' ').trim();
    const solutionHtml = (typePayload.solution || '').replace(/\s+/g, ' ').trim();
    const answerKey = typePayload.answer;

    // Deduplicate identical student comments while preserving reportIds and counts
    const commentMap = new Map();
    (invCase.reports || []).forEach(r => {
      const text = (r.comment || '').trim();
      if (!commentMap.has(text)) {
        commentMap.set(text, {
          reportIds: [r.reportId],
          studentId: r.studentId,
          comment: text,
          injectionDetected: !!r.injectionRisk?.injectionDetected,
          injectionRiskLevel: r.injectionRisk?.riskLevel || 'none'
        });
      } else {
        commentMap.get(text).reportIds.push(r.reportId);
      }
    });

    const uniqueReports = Array.from(commentMap.values()).map(item => ({
      reportIds: item.reportIds,
      studentClaim: item.comment,
      injectionDetected: item.injectionDetected,
      riskLevel: item.injectionRiskLevel
    }));

    return {
      caseId: invCase.caseId,
      questionId: invCase.questionId,
      status: invCase.status,
      reportCount: invCase.reportCount,
      questionMetadata: {
        type: qType,
        subject: question.subject || 'JEE Academic',
        chapter: question.chapter || 'General',
        concept: question.concept || undefined
      },
      content: {
        questionHtml: qHtml,
        solutionHtml: solutionHtml,
        storedAnswer: answerKey
      },
      errorHistory: (question.errorHistory || []).map(eh => ({
        type: eh.type,
        note: eh.note,
        actor: eh.actor
      })),
      studentReports: uniqueReports,
      injectionAnalysis: {
        injectionDetected: !!invCase.injectionAnalysis?.injectionDetected,
        riskLevel: invCase.injectionAnalysis?.riskLevel || 'none'
      },
      taxonomyRules: {
        verdicts: taxonomy?.verdicts || {},
        repairs: taxonomy?.repairs || {}
      }
    };
  }
}

module.exports = new InvestigationContextService();
