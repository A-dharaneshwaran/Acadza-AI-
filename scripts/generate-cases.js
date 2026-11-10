const { connectDB, closeDB } = require('../server/src/config/database');
const caseGenerationService = require('../server/src/services/triage/caseGenerationService');
const InvestigationCase = require('../server/src/models/InvestigationCase');

async function run() {
  console.log('====================================================');
  console.log('   ACADZA INVESTIGATION CASE GENERATION (PHASE 02)');
  console.log('====================================================');

  await connectDB();

  console.log('[Case Generation] Processing reports into investigation cases...');
  const result = await caseGenerationService.generateCases();

  console.log(`[Summary] Total reports processed: ${result.totalReports}`);
  console.log(`[Summary] Grouped distinct questions: ${result.groupedQuestionCount}`);
  console.log(`[Summary] Investigation Cases created: ${result.casesCreated}`);
  console.log(`[Summary] Investigation Cases updated: ${result.casesUpdated}`);
  console.log(`[Summary] Total Investigation Cases in DB: ${result.totalCases}`);

  // Query high-risk injection cases to verify detection
  const injectionCases = await InvestigationCase.find({ 'injectionAnalysis.injectionDetected': true }).lean();
  console.log(`[Security] Cases flagged with injection risk: ${injectionCases.length}`);
  injectionCases.forEach(c => {
    console.log(`  - Case ${c.caseId} (Question: ${c.questionId}): Risk Level: ${c.injectionAnalysis.riskLevel}`);
    c.reports.forEach(r => {
      if (r.injectionRisk.injectionDetected) {
        console.log(`    Report ${r.reportId}: "${r.comment}"`);
        console.log(`    Explanation: ${r.injectionRisk.explanation}`);
      }
    });
  });

  await closeDB();
  console.log('[Complete] Investigation cases generated and verified.');
}

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[Error] Failed to generate cases:', err);
      process.exit(1);
    });
}

module.exports = { run };

