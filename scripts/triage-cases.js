const { connectDB, closeDB } = require('../server/src/config/database');
const triageOrchestrator = require('../server/src/services/ai/triageOrchestrator');
const InvestigationCase = require('../server/src/models/InvestigationCase');

async function run() {
  console.log('====================================================');
  console.log('   ACADZA AI TRIAGE ENGINE — FIRST CASE TEST (PHASE 03)');
  console.log('====================================================');

  await connectDB();

  // Select target case: specifically Case for 60f744b3f1b9bc7cc7b4a949 (R001, R002, R003)
  const targetCaseId = process.argv[2] || 'CASE_60f744b3f1b9bc7cc7b4a949';
  console.log(`[Target Case] Evaluating: ${targetCaseId}`);

  try {
    const startTime = Date.now();
    const result = await triageOrchestrator.triageCase(targetCaseId);
    const durationMs = Date.now() - startTime;

    console.log('\n---------------- INFERENCE RESULT ----------------');
    console.log(`Case ID:         ${result.caseId}`);
    console.log(`Question ID:     ${result.questionId}`);
    console.log(`Model Used:      ${result.recommendation.model}`);
    console.log(`Verdict:         ${result.recommendation.verdict}`);
    console.log(`Repair Type:     ${result.recommendation.repairType || 'None'}`);
    console.log(`Confidence:      ${result.recommendation.confidence}`);
    console.log(`Action:          ${result.recommendation.recommendedAction}`);
    console.log(`Review Required: ${result.recommendation.facultyReviewRequired}`);
    console.log(`Duration:        ${durationMs} ms`);
    console.log('\n--- Evidence & Summary ---');
    console.log(`Summary: ${result.recommendation.summary}`);
    console.log(`Reasoning: ${result.recommendation.reasoning}`);
    console.log('\n--- Proposed Edit ---');
    console.log(JSON.stringify(result.recommendation.proposedEdit, null, 2));
    console.log('\n--- Student Reply Preview ---');
    console.log(`"${result.recommendation.studentReplyPreview}"`);
    console.log('--------------------------------------------------\n');
  } catch (err) {
    console.error(`[Error] Triage execution failed:`, err.message);
  } finally {
    await closeDB();
  }
}

if (require.main === module) {
  run().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { run };
