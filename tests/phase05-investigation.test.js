const assert = require('assert');
const path = require('path');
const reportInvestigationService = require('../server/src/services/investigation/reportInvestigationService');

async function runTests() {
  console.log('====================================================');
  console.log('   RUNNING PHASE 05 REPORT INVESTIGATION TESTS');
  console.log('====================================================');

  const { rawTaxonomy, rawQuestions, rawReports, questionMap } = reportInvestigationService.loadSourceData();

  // Test 1: Inventory Verification
  console.log('\n[Test 1] Inventory Verification...');
  assert.strictEqual(rawReports.length, 44, 'Should discover exactly 44 reports');
  assert.strictEqual(rawQuestions.length, 43, 'Should discover exactly 43 questions');
  assert.strictEqual(Object.keys(rawTaxonomy.verdicts).length, 7, 'Should have exactly 7 verdicts');
  assert.strictEqual(Object.keys(rawTaxonomy.repairs).length, 18, 'Should have exactly 18 repairs');
  console.log('✓ Passed: Inventory counts match specification.');

  // Test 2: Full Investigation Run
  console.log('\n[Test 2] Full Investigation Run...');
  const summary = await reportInvestigationService.runInvestigation({ persist: false });
  assert.strictEqual(summary.totalReportsInvestigated, 44, 'All 44 reports must be investigated');
  assert.strictEqual(summary.totalDistinctCases, 39, 'Must group into 39 distinct cases');
  assert.strictEqual(summary.unresolvedCount, 0, 'No reports should be unresolved');
  console.log('✓ Passed: All 44 reports evaluated with 0 unresolved.');

  // Test 3: Permitted Taxonomy Verdicts Only
  console.log('\n[Test 3] Permitted Taxonomy Verdicts...');
  const allowedVerdicts = new Set(Object.keys(rawTaxonomy.verdicts));
  summary.findings.forEach(f => {
    assert(allowedVerdicts.has(f.verdict), `Verdict "${f.verdict}" must be in taxonomy`);
  });
  console.log('✓ Passed: All findings use official taxonomy verdicts.');

  // Test 4: Permitted Taxonomy Repairs Only
  console.log('\n[Test 4] Permitted Taxonomy Repairs...');
  const allowedRepairs = new Set(Object.keys(rawTaxonomy.repairs));
  summary.findings.forEach(f => {
    if (f.repairType !== null) {
      assert(allowedRepairs.has(f.repairType), `Repair "${f.repairType}" must be in taxonomy`);
    }
  });
  console.log('✓ Passed: All repair types exist in taxonomy.');

  // Test 5: Repair Field Permission Enforcement
  console.log('\n[Test 5] Repair Field Permission Enforcement...');
  summary.findings.forEach(f => {
    if (f.proposedEdit && f.proposedEdit.field) {
      const repairDef = rawTaxonomy.repairs[f.repairType];
      assert(
        repairDef.fields.includes(f.proposedEdit.field),
        `Repair "${f.repairType}" cannot modify field "${f.proposedEdit.field}"`
      );
    }
  });
  console.log('✓ Passed: All proposed edits obey taxonomy allowed fields.');

  // Test 6: Human-Only Repair Restrictions (auto: false)
  console.log('\n[Test 6] Human-Only Repair Restrictions...');
  const humanOnlyRepairs = ['identical_options', 'diagram', 'wrong_question', 'unsound', 'wrong_chapter', 'syllabus'];
  summary.findings.forEach(f => {
    if (humanOnlyRepairs.includes(f.repairType)) {
      assert.strictEqual(f.requiresFacultyReview, true, `${f.repairType} must require faculty review`);
      assert.strictEqual(f.autoEligible, false, `${f.repairType} must not be auto eligible`);
    }
  });
  console.log('✓ Passed: Human-only repairs strictly enforced.');

  // Test 7: Adversarial Injection Protection (R027)
  console.log('\n[Test 7] Adversarial Injection Protection (R027)...');
  const r027 = summary.findings.find(f => f.reportId === 'R027');
  assert(r027, 'R027 must be present');
  assert.strictEqual(r027.injectionDetected, true, 'R027 injection must be flagged');
  assert(r027.injectionEvidence.includes('Adversarial'), 'Injection evidence must describe payload');
  assert.strictEqual(r027.verdict, 'no_error', 'R027 underlying physics must be evaluated independently');
  console.log('✓ Passed: R027 prompt injection quarantined and question evaluated independently.');

  // Test 8: High-Stakes Answer Key Check (LCR circuit R001, R002, R003)
  console.log('\n[Test 8] High-Stakes Answer Key Check (R001, R002, R003)...');
  const lcrReports = summary.findings.filter(f => ['R001', 'R002', 'R003'].includes(f.reportId));
  assert.strictEqual(lcrReports.length, 3, 'Must find all 3 LCR reports');
  lcrReports.forEach(r => {
    assert.strictEqual(r.verdict, 'defect');
    assert.strictEqual(r.repairType, 'answer_key');
    assert.strictEqual(r.requiresFacultyReview, true, 'High stakes answer key must require faculty review');
    assert.strictEqual(r.proposedEdit.field, 'answer');
    assert.strictEqual(r.proposedEdit.find, 'C');
    assert.strictEqual(r.proposedEdit.replace, 'A');
  });
  console.log('✓ Passed: LCR circuit reports correctly identify answer_key defect C -> A with faculty approval required.');

  // Test 9: Multi-Report Grouping
  console.log('\n[Test 9] Multi-Report Grouping...');
  const caseMap = new Map();
  summary.findings.forEach(f => {
    if (!caseMap.has(f.caseId)) caseMap.set(f.caseId, []);
    caseMap.get(f.caseId).push(f);
  });
  assert.strictEqual(caseMap.size, 39, 'Must group into 39 distinct cases');
  assert.strictEqual(caseMap.get('CASE_60f744b3f1b9bc7cc7b4a949').length, 3, 'LCR case has 3 reports');
  assert.strictEqual(caseMap.get('CASE_60f742f6660d187cc13a8078').length, 2, 'Inductance case has 2 reports');
  assert.strictEqual(caseMap.get('CASE_622f08d7b70e4b50e4500a1b').length, 2, 'Spring mass case has 2 reports');
  assert.strictEqual(caseMap.get('CASE_612151a6a34397610a9a2e58').length, 2, 'de-Broglie case has 2 reports');
  console.log('✓ Passed: All multi-report questions properly grouped.');

  // Test 10: Invalid Taxonomy Key Rejection
  console.log('\n[Test 10] Invalid Taxonomy Key Rejection...');
  assert.throws(() => {
    reportInvestigationService.finalizeFinding(
      { reportId: 'TEST', verdict: 'invalid_verdict_key' },
      rawTaxonomy
    );
  }, /Invalid verdict/);

  assert.throws(() => {
    reportInvestigationService.finalizeFinding(
      { reportId: 'TEST', verdict: 'defect', repairType: 'invalid_repair_key' },
      rawTaxonomy
    );
  }, /Invalid repair/);
  console.log('✓ Passed: Invalid taxonomy keys correctly rejected.');

  console.log('\n====================================================');
  console.log('   ALL 10 TEST SUITES PASSED SUCCESSFULLY (100%)');
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

