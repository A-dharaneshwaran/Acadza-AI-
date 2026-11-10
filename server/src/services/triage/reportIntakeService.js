const Question = require('../../models/Question');
const Report = require('../../models/Report');
const Taxonomy = require('../../models/Taxonomy');

/**
 * Report Intake Service
 * Responsible for ingesting and resolving individual reports from MongoDB,
 * enriching each with its corresponding question context, error history,
 * and applicable taxonomy rules without modifying underlying records.
 */
class ReportIntakeService {
  /**
   * Fetch all raw reports from database.
   */
  async getAllReports() {
    return await Report.find({}).sort({ reportedAt: 1 }).lean();
  }

  /**
   * Fetch a single report by its reportId with full referenced question context.
   * @param {string} reportId - Unique report identifier e.g., 'R005'
   */
  async getReportWithContext(reportId) {
    const report = await Report.findOne({ reportId }).lean();
    if (!report) {
      return null;
    }

    const question = await Question.findById(report.questionId).lean();
    const taxonomy = await Taxonomy.findById('acadza_taxonomy_v1').lean();

    return {
      report,
      question: question || null,
      questionFound: !!question,
      errorHistory: question?.errorHistory || [],
      questionType: question?.questionType || null,
      questionData: question ? question[question.questionType] : null,
      taxonomy: taxonomy || null
    };
  }

  /**
   * Fetch all reports enriched with referenced question status and context.
   */
  async getEnrichedReports() {
    const reports = await this.getAllReports();
    const questionIds = [...new Set(reports.map(r => r.questionId))];
    
    const questions = await Question.find({ _id: { $in: questionIds } }).lean();
    const questionMap = new Map(questions.map(q => [q._id, q]));
    const taxonomy = await Taxonomy.findById('acadza_taxonomy_v1').lean();

    return reports.map(report => {
      const question = questionMap.get(report.questionId);
      return {
        reportId: report.reportId,
        questionId: report.questionId,
        studentId: report.studentId,
        source: report.source,
        reportedAt: report.reportedAt,
        comment: report.comment,
        questionFound: !!question,
        questionSummary: question ? {
          qid: question.qid,
          questionType: question.questionType,
          subject: question.subject,
          chapter: question.chapter,
          concept: question.concept,
          hasErrorHistory: (question.errorHistory && question.errorHistory.length > 0)
        } : null,
        errorHistory: question?.errorHistory || [],
        taxonomyAvailable: !!taxonomy
      };
    });
  }
}

module.exports = new ReportIntakeService();

