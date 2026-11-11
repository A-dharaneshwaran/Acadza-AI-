const express = require('express');
const router = express.Router();
const ReportInvestigation = require('../models/ReportInvestigation');
const reportInvestigationService = require('../services/investigation/reportInvestigationService');
const { authenticateToken, requireFaculty } = require('../middleware/authMiddleware');
const fs = require('fs');
const path = require('path');

// Load authoritative taxonomy once for query validation
const taxonomyPath = path.resolve(__dirname, '../../../GIVEN_DATA/taxonomy.json');
const rawTaxonomy = JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'));
const allowedVerdicts = new Set(Object.keys(rawTaxonomy.verdicts));
const allowedRepairs = new Set(Object.keys(rawTaxonomy.repairs));

/**
 * Validate and sanitize query filters against whitelist
 * Rejects MongoDB query operator injection and unlisted taxonomy values
 */
function validateQueryParams(query) {
  const filter = {};
  const allowedKeys = ['verdict', 'repairType', 'caseId', 'questionId', 'requiresFacultyReview'];

  for (const key of Object.keys(query)) {
    if (!allowedKeys.includes(key)) {
      throw new Error(`Invalid query parameter "${key}". Permitted: ${allowedKeys.join(', ')}`);
    }

    const val = query[key];
    // Reject non-primitive values (object selectors like { $ne: null })
    if (typeof val === 'object' || Array.isArray(val)) {
      throw new Error(`Invalid parameter format for "${key}". Object selectors are not allowed.`);
    }

    if (typeof val === 'string' && val.startsWith('$')) {
      throw new Error(`Operator injection rejected on parameter "${key}".`);
    }
  }

  if (query.verdict !== undefined) {
    if (typeof query.verdict !== 'string' || !allowedVerdicts.has(query.verdict)) {
      throw new Error(`Invalid verdict value "${query.verdict}". Must be valid taxonomy verdict.`);
    }
    filter.verdict = query.verdict;
  }

  if (query.repairType !== undefined) {
    if (typeof query.repairType !== 'string' || !allowedRepairs.has(query.repairType)) {
      throw new Error(`Invalid repairType value "${query.repairType}". Must be valid taxonomy repair.`);
    }
    filter.repairType = query.repairType;
  }

  if (query.caseId !== undefined) {
    if (typeof query.caseId !== 'string' || query.caseId.length < 3 || query.caseId.length > 80) {
      throw new Error('Invalid caseId parameter.');
    }
    filter.caseId = query.caseId;
  }

  if (query.questionId !== undefined) {
    if (typeof query.questionId !== 'string' || query.questionId.length < 3 || query.questionId.length > 80) {
      throw new Error('Invalid questionId parameter.');
    }
    filter.questionId = query.questionId;
  }

  if (query.requiresFacultyReview !== undefined) {
    if (query.requiresFacultyReview !== 'true' && query.requiresFacultyReview !== 'false') {
      throw new Error('requiresFacultyReview must be "true" or "false".');
    }
    filter.requiresFacultyReview = query.requiresFacultyReview === 'true';
  }

  return filter;
}

/**
 * GET /api/investigations/summary
 * Protected by authenticateToken and requireFaculty
 */
router.get('/investigations/summary', authenticateToken, requireFaculty, async (req, res) => {
  try {
    const summary = await reportInvestigationService.runInvestigation({ persist: false });
    const { findings, ...meta } = summary;
    res.json({
      success: true,
      summary: meta
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/investigations
 * Protected by authenticateToken and requireFaculty
 */
router.get('/investigations', authenticateToken, requireFaculty, async (req, res) => {
  try {
    const filter = validateQueryParams(req.query);
    const items = await ReportInvestigation.find(filter).sort({ reportId: 1 }).lean();
    res.json({
      success: true,
      count: items.length,
      items
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/investigations/:reportId
 * Protected by authenticateToken and requireFaculty
 */
router.get('/investigations/:reportId', authenticateToken, requireFaculty, async (req, res) => {
  try {
    const reportId = req.params.reportId;
    if (typeof reportId !== 'string' || !/^R\d{3}$/.test(reportId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid reportId format. Expected format R001-R999.'
      });
    }

    const item = await ReportInvestigation.findOne({ reportId }).lean();
    if (!item) {
      return res.status(404).json({
        success: false,
        error: `Investigation finding for report ${reportId} not found.`
      });
    }

    res.json({
      success: true,
      item
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
