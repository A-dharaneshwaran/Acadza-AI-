/**
 * Duplicate Grouping Service
 * Aggregates reports referring to the same questionId to build unified investigation contexts.
 *
 * CRITICAL PRINCIPLE:
 * A duplicate report represents multiple student encounters, which informs urgency and
 * reporting activity, but is NOT ground truth evidence of a question defect.
 * Individual student identities, timestamps, and comments are never discarded.
 */
class DuplicateGroupingService {
  /**
   * Group an array of report documents by questionId.
   * @param {Array<Object>} reports - List of report objects
   * @returns {Array<Object>} List of grouped investigation objects
   */
  groupByQuestion(reports) {
    if (!Array.isArray(reports)) {
      throw new Error('Expected an array of reports to group');
    }

    const groups = new Map();

    for (const report of reports) {
      const qid = report.questionId;
      if (!groups.has(qid)) {
        groups.set(qid, {
          questionId: qid,
          reportIds: [],
          reports: [],
          totalReportCount: 0,
          studentComments: [],
          firstReportedAt: null,
          lastReportedAt: null
        });
      }

      const entry = groups.get(qid);
      entry.reportIds.push(report.reportId);
      entry.reports.push({
        reportId: report.reportId,
        studentId: report.studentId,
        source: report.source,
        comment: report.comment,
        reportedAt: report.reportedAt
      });
      entry.totalReportCount += 1;
      entry.studentComments.push({
        reportId: report.reportId,
        comment: report.comment || ''
      });

      const reportDate = new Date(report.reportedAt);
      if (!entry.firstReportedAt || reportDate < new Date(entry.firstReportedAt)) {
        entry.firstReportedAt = reportDate.toISOString();
      }
      if (!entry.lastReportedAt || reportDate > new Date(entry.lastReportedAt)) {
        entry.lastReportedAt = reportDate.toISOString();
      }
    }

    return Array.from(groups.values());
  }
}

module.exports = new DuplicateGroupingService();

