const fs = require('fs');
const path = require('path');
const { connectDB, closeDB } = require('../server/src/config/database');
const Question = require('../server/src/models/Question');
const Report = require('../server/src/models/Report');
const Taxonomy = require('../server/src/models/Taxonomy');

async function importData() {
  const startTime = Date.now();
  console.log('====================================================');
  console.log('   ACADZA DATA IMPORT PIPELINE (PHASE 01)');
  console.log('====================================================');

  await connectDB();

  const givenDataDir = path.resolve(__dirname, '../GIVEN_DATA');
  const questionsPath = path.join(givenDataDir, 'questions.json');
  const reportsPath = path.join(givenDataDir, 'reports.json');
  const taxonomyPath = path.join(givenDataDir, 'taxonomy.json');

  if (!fs.existsSync(questionsPath) || !fs.existsSync(reportsPath) || !fs.existsSync(taxonomyPath)) {
    throw new Error(`One or more required GIVEN_DATA files missing in ${givenDataDir}`);
  }

  const rawQuestions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
  const rawReports = JSON.parse(fs.readFileSync(reportsPath, 'utf8'));
  const rawTaxonomy = JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'));

  console.log(`[Source] Found ${rawQuestions.length} questions.`);
  console.log(`[Source] Found ${rawReports.length} reports.`);
  console.log(`[Source] Taxonomy contains ${Object.keys(rawTaxonomy.verdicts || {}).length} verdicts and ${Object.keys(rawTaxonomy.repairs || {}).length} repairs.`);

  // 1. Idempotent Import of Questions (bulkWrite with upsert)
  const questionOps = rawQuestions.map(q => ({
    updateOne: {
      filter: { _id: q._id },
      update: { $set: q },
      upsert: true
    }
  }));
  const qResult = await Question.bulkWrite(questionOps);
  console.log(`[Questions Import] Upserted: ${qResult.upsertedCount}, Modified: ${qResult.modifiedCount}, Matched: ${qResult.matchedCount}`);

  // 2. Idempotent Import of Reports (bulkWrite with upsert)
  const reportOps = rawReports.map(r => ({
    updateOne: {
      filter: { reportId: r.reportId },
      update: { $set: r },
      upsert: true
    }
  }));
  const rResult = await Report.bulkWrite(reportOps);
  console.log(`[Reports Import] Upserted: ${rResult.upsertedCount}, Modified: ${rResult.modifiedCount}, Matched: ${rResult.matchedCount}`);

  // 3. Idempotent Import of Taxonomy
  const taxonomyDoc = {
    _id: 'acadza_taxonomy_v1',
    _about: rawTaxonomy._about,
    verdicts: rawTaxonomy.verdicts,
    repairs: rawTaxonomy.repairs
  };
  await Taxonomy.updateOne(
    { _id: 'acadza_taxonomy_v1' },
    { $set: taxonomyDoc },
    { upsert: true }
  );
  console.log(`[Taxonomy Import] Successfully synchronized taxonomy.`);

  // 4. Verification of database counts & integrity
  const dbQuestionCount = await Question.countDocuments();
  const dbReportCount = await Report.countDocuments();
  const dbTaxonomy = await Taxonomy.findById('acadza_taxonomy_v1');

  // Verify all report questionIds link to existing questions
  const distinctReportQids = await Report.distinct('questionId');
  const existingQuestionsForReports = await Question.countDocuments({ _id: { $in: distinctReportQids } });
  const allReportsReferValidQuestions = existingQuestionsForReports === distinctReportQids.length;

  const importSummary = {
    timestamp: new Date().toISOString(),
    executionDurationMs: Date.now() - startTime,
    sourceFiles: {
      questionsCount: rawQuestions.length,
      reportsCount: rawReports.length,
      taxonomyVerdictsCount: Object.keys(rawTaxonomy.verdicts || {}).length,
      taxonomyRepairsCount: Object.keys(rawTaxonomy.repairs || {}).length
    },
    databaseCounts: {
      questionsCount: dbQuestionCount,
      reportsCount: dbReportCount,
      taxonomyLoaded: !!dbTaxonomy,
      distinctQuestionsReported: distinctReportQids.length,
      validRelationships: allReportsReferValidQuestions
    },
    integrityCheck: {
      questionsMatch: rawQuestions.length === dbQuestionCount,
      reportsMatch: rawReports.length === dbReportCount,
      allReportQuestionIdsExist: allReportsReferValidQuestions,
      status: (rawQuestions.length === dbQuestionCount && rawReports.length === dbReportCount && allReportsReferValidQuestions) ? 'PASSED' : 'FAILED'
    }
  };

  // Write import-report.json to root
  const reportPath = path.resolve(__dirname, '../import-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(importSummary, null, 2), 'utf8');
  console.log(`[Report Generated] Saved report to ${reportPath}`);
  console.log('Integrity Status:', importSummary.integrityCheck.status);

  await closeDB();
  return importSummary;
}

if (require.main === module) {
  importData()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Data import failed:', err);
      process.exit(1);
    });
}

module.exports = { importData };

