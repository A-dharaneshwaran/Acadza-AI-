const { connectDB, closeDB } = require('../server/src/config/database');
const triageOrchestrator = require('../server/src/services/ai/triageOrchestrator');
const InvestigationCase = require('../server/src/models/InvestigationCase');

/**
 * Controlled CLI Case Processing Runner
 * Supports:
 *   --case <caseId>
 *   --limit <number>
 *   --all
 *   --force
 * Default: processes exactly ONE case.
 */
async function run() {
  const args = process.argv.slice(2);
  let caseId = null;
  let limit = 1;
  let processAll = false;
  let force = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--case' && args[i + 1]) {
      caseId = args[i + 1];
      i++;
    } else if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10) || 1;
      i++;
    } else if (args[i] === '--all') {
      processAll = true;
    } else if (args[i] === '--force') {
      force = true;
    }
  }

  console.log('====================================================');
  console.log('   ACADZA AI TRIAGE ENGINE (FREE ENDPOINT RUNNER)');
  console.log('====================================================');

  await connectDB();

  let targetCases = [];
  if (caseId) {
    const c = await InvestigationCase.findOne({ caseId }).lean();
    if (!c) {
      console.error(`Case ${caseId} not found in database.`);
      await closeDB();
      process.exit(1);
    }
    // Strict Lock: Never bypass an active processing case under any circumstances
    if (c.aiTriage?.status === 'processing') {
      console.error(`[-] Case ${caseId} is currently in-flight/processing. Cannot submit duplicate request.`);
      await closeDB();
      process.exit(1);
    }
    // If case has failed previously and force is not specified, do not automatically re-run
    if (c.aiTriage?.status === 'failed' && !force) {
      console.log(`[-] Case ${caseId} previously failed (${c.aiTriage?.error}). Automatic resubmission blocked. Pass --force to retry.`);
      await closeDB();
      process.exit(0);
    }
    targetCases = [c];
  } else if (processAll) {
    // Only pick cases that are not completed, not failed (unless force), and not in-flight
    const filter = force 
      ? { 'aiTriage.status': { $ne: 'processing' } } 
      : { 'aiTriage.status': { $nin: ['completed', 'failed', 'processing'] } };
    targetCases = await InvestigationCase.find(filter).sort({ reportCount: -1, lastReportedAt: -1 }).lean();
  } else {
    // Default: find pending cases (never auto-process failed, completed, or in-flight without force)
    const filter = force 
      ? { 'aiTriage.status': { $ne: 'processing' } } 
      : { 'aiTriage.status': { $nin: ['completed', 'failed', 'processing'] } };
    targetCases = await InvestigationCase.find(filter)
      .sort({ reportCount: -1, lastReportedAt: -1 })
      .limit(limit)
      .lean();
  }

  console.log(`[Queue Plan] Cases selected for triage: ${targetCases.length}`);

  let processedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const c of targetCases) {
    console.log(`\n>>> Processing [${c.caseId}] (Question: ${c.questionId}, Reports: ${c.reportCount})`);
    try {
      const res = await triageOrchestrator.triageCase(c.caseId, { force });
      if (res.skipped) {
        console.log(`[-] ${res.message}`);
        skippedCount++;
      } else {
        const rec = res.recommendation;
        console.log(`[+] SUCCESS!`);
        console.log(`    Verdict:     ${rec.verdict}`);
        console.log(`    Repair Type: ${rec.repairType || 'None'}`);
        console.log(`    Confidence:  ${rec.confidence}`);
        console.log(`    Summary:     ${rec.summary}`);
        console.log(`    Action:      ${rec.recommendedAction}`);
        if (rec.usage) {
          console.log(`    Tokens:      Prompt: ${rec.usage.promptTokens}, Completion: ${rec.usage.completionTokens}, Total: ${rec.usage.totalTokens}`);
        }
        processedCount++;
      }
    } catch (err) {
      console.error(`[!] Failed to triage ${c.caseId}:`, err.message);
      failedCount++;
      if (err.isRateLimit) {
        console.error(`[CRITICAL] Free endpoint quota or rate-limit reached. Halting batch sequence immediately.`);
        break;
      }
    }
  }

  console.log('\n====================================================');
  console.log(`Run complete. Processed: ${processedCount}, Skipped: ${skippedCount}, Failed: ${failedCount}`);
  console.log('====================================================');

  await closeDB();
}

if (require.main === module) {
  run().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { run };
