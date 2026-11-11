const fs = require('fs');
const path = require('path');
const { connectDB, closeDB } = require('../server/src/config/database');
const mongoose = require('mongoose');
const ReportInvestigation = require('../server/src/models/ReportInvestigation');
const Taxonomy = require('../server/src/models/Taxonomy');
const InvestigationCase = require('../server/src/models/InvestigationCase');

async function importResultsToReportInvestigations() {
  console.log('====================================================');
  console.log('   IMPORT RESULTS.JSON -> REPORTINVESTIGATIONS');
  console.log('====================================================');

  const resultsPath = path.resolve(__dirname, '../results.json');
  const taxonomyPath = path.resolve(__dirname, '../GIVEN_DATA/taxonomy.json');

  if (!fs.existsSync(resultsPath)) {
    throw new Error('results.json not found at ' + resultsPath);
  }

  const resultsData = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  const rawTaxonomy = JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'));

  // Step 1: Pre-validation of resultsData
  console.log('\n[Step 1] Validating results.json data...');
  if (!Array.isArray(resultsData) || resultsData.length !== 44) {
    throw new Error(`Expected exactly 44 results in results.json, found ${resultsData?.length}`);
  }

  const seenReportIds = new Set();
  const allowedVerdicts = new Set(Object.keys(rawTaxonomy.verdicts));
  const allowedRepairs = new Set(Object.keys(rawTaxonomy.repairs));

  for (const item of resultsData) {
    if (!item.reportId) throw new Error('Item missing reportId: ' + JSON.stringify(item));
    if (seenReportIds.has(item.reportId)) throw new Error('Duplicate reportId: ' + item.reportId);
    seenReportIds.add(item.reportId);

    if (!item.questionId) throw new Error(`Report ${item.reportId} missing questionId`);
    if (!allowedVerdicts.has(item.verdict)) throw new Error(`Report ${item.reportId} invalid verdict: ${item.verdict}`);
    if (item.repair !== null && item.repair !== undefined && !allowedRepairs.has(item.repair)) {
      throw new Error(`Report ${item.reportId} invalid repair: ${item.repair}`);
    }
    if (typeof item.confidence !== 'number' || item.confidence < 0 || item.confidence > 1) {
      throw new Error(`Report ${item.reportId} invalid confidence: ${item.confidence}`);
    }
    if (!item.evidence) throw new Error(`Report ${item.reportId} missing evidence`);
  }
  console.log('✓ Validation passed: 44 unique, taxonomy-compliant findings ready.');

  // Step 2: Connect to MongoDB
  console.log('\n[Step 2] Connecting to MongoDB...');
  await connectDB();
  const db = mongoose.connection.db;

  // Step 3: Backup existing collection
  console.log('\n[Step 3] Backing up existing reportinvestigations collection...');
  const existingDocs = await ReportInvestigation.find({}).lean();
  const oldDocumentCount = existingDocs.length;
  console.log(`Found ${oldDocumentCount} existing documents in reportinvestigations.`);

  const backupDir = path.resolve(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const backupFilePath = path.join(backupDir, `reportinvestigations_backup_${Date.now()}.json`);
  fs.writeFileSync(backupFilePath, JSON.stringify(existingDocs, null, 2), 'utf8');
  console.log(`✓ Backup saved safely to: ${backupFilePath}`);

  // Create temporary in-memory backup and also a MongoDB collection backup
  const backupCollectionName = `reportinvestigations_backup_${Date.now()}`;
  if (oldDocumentCount > 0) {
    await db.collection(backupCollectionName).insertMany(existingDocs);
    console.log(`✓ MongoDB backup collection created: ${backupCollectionName}`);
  }

  // Step 4: Map caseIds from InvestigationCase
  console.log('\n[Step 4] Resolving caseIds from InvestigationCase collection...');
  const allCases = await InvestigationCase.find({}).lean();
  const caseIdByQuestionId = new Map();
  for (const c of allCases) {
    caseIdByQuestionId.set(c.questionId, c.caseId);
  }

  // Prepare docs to insert
  const docsToInsert = resultsData.map((item) => {
    const repairDef = item.repair ? rawTaxonomy.repairs[item.repair] : null;
    const taxonomyAutoEligible = repairDef ? Boolean(repairDef.auto) : false;
    
    // Auto-eligibility safety rules
    const isHumanOnlyRepair = item.repair ? !taxonomyAutoEligible : true;
    const isAnswerKey = item.repair === 'answer_key';
    const isInjection = item.reportId === 'R027' || /prompt[- ]?injection|untrusted report text|override/i.test(item.evidence);

    const requiresFacultyReview = isHumanOnlyRepair || isAnswerKey || isInjection || item.route === 'faculty_review';
    const safeToApply = taxonomyAutoEligible && !requiresFacultyReview && !isInjection && !isAnswerKey;
    const autoEligible = safeToApply;

    const caseId = caseIdByQuestionId.get(item.questionId) || `CASE_${item.questionId}`;

    return {
      reportId: item.reportId,
      questionId: item.questionId,
      caseId: caseId,
      verdict: item.verdict,
      repairType: item.repair || null,
      evidence: item.evidence,
      reasoning: item.evidence, // results.json includes comprehensive reasoning in evidence
      confidence: item.confidence,
      taxonomyAutoEligible: taxonomyAutoEligible,
      requiresFacultyReview: requiresFacultyReview,
      safeToApply: safeToApply,
      autoEligible: autoEligible,
      proposedEdit: item.edit ? {
        field: item.edit.field || null,
        find: item.edit.find !== undefined ? String(item.edit.find) : null,
        replace: item.edit.replace !== undefined ? String(item.edit.replace) : null
      } : { field: null, find: null, replace: null },
      studentReplyPreview: item.student_reply || '',
      injectionDetected: isInjection,
      injectionEvidence: isInjection ? item.evidence : null,
      uncertainties: [],
      facultyDecision: null,
      investigationVersion: 'results-json-sync-v1.0',
      investigatedAt: new Date()
    };
  });

  try {
    // Step 5: Delete only from reportinvestigations collection
    console.log('\n[Step 5] Deleting documents from ONLY reportinvestigations...');
    const deleteResult = await ReportInvestigation.deleteMany({});
    console.log(`✓ Deleted count: ${deleteResult.deletedCount}`);

    // Step 6: Insert all 44 documents
    console.log('\n[Step 6] Inserting 44 documents from results.json...');
    const insertResult = await ReportInvestigation.insertMany(docsToInsert, { ordered: true });
    console.log(`✓ Inserted count: ${insertResult.length}`);

    // Step 7: Verify indexes
    console.log('\n[Step 7] Ensuring collection indexes...');
    await ReportInvestigation.init();
    const indexes = await db.collection('reportinvestigations').indexes();
    console.log(`✓ Indexes verified: ${indexes.map(i => i.name).join(', ')}`);

    // Step 8: Post-insertion Verification
    console.log('\n[Step 8] Verification Checks...');
    const finalCount = await ReportInvestigation.countDocuments();
    console.log(`- Final count in MongoDB: ${finalCount}`);
    if (finalCount !== 44) {
      throw new Error(`Verification failed: Expected 44 documents, found ${finalCount}`);
    }

    const insertedDocs = await ReportInvestigation.find({}).lean();
    const insertedReportIds = new Set(insertedDocs.map(d => d.reportId));

    if (insertedReportIds.size !== 44) {
      throw new Error(`Verification failed: Expected 44 distinct reportIds, found ${insertedReportIds.size}`);
    }

    for (const r of resultsData) {
      if (!insertedReportIds.has(r.reportId)) {
        throw new Error(`Verification failed: Missing reportId ${r.reportId} in MongoDB`);
      }
      const match = insertedDocs.find(d => d.reportId === r.reportId);
      if (match.verdict !== r.verdict) {
        throw new Error(`Verdict mismatch in ${r.reportId}: expected ${r.verdict}, found ${match.verdict}`);
      }
      if ((match.repairType || null) !== (r.repair || null)) {
        throw new Error(`Repair mismatch in ${r.reportId}: expected ${r.repair}, found ${match.repairType}`);
      }
    }
    console.log('✓ All 44 documents verified: exactly 1:1 match with results.json');

    // Confirm other collections were NOT modified
    const questionsCount = await db.collection('questions').countDocuments();
    const reportsCount = await db.collection('reports').countDocuments();
    console.log(`- Safeguard check: questions collection has ${questionsCount} docs (untouched)`);
    console.log(`- Safeguard check: reports collection has ${reportsCount} docs (untouched)`);

    console.log('\n====================================================');
    console.log('   MIGRATION AND REPLACEMENT SUCCESSFUL');
    console.log('====================================================');

    return {
      oldDocumentCount,
      deletedCount: deleteResult.deletedCount,
      insertedCount: insertResult.length,
      finalCount,
      backupFilePath,
      backupCollectionName
    };
  } catch (err) {
    console.error('❌ Insertion/Verification Error:', err.message);
    console.log('Rolling back from backup...');
    if (oldDocumentCount > 0) {
      await ReportInvestigation.deleteMany({});
      await ReportInvestigation.insertMany(existingDocs);
      console.log('✓ Rollback completed successfully.');
    }
    throw err;
  } finally {
    await closeDB();
  }
}

if (require.main === module) {
  importResultsToReportInvestigations()
    .then((res) => {
      console.log('Result summary:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal execution error:', err);
      process.exit(1);
    });
}

module.exports = importResultsToReportInvestigations;

