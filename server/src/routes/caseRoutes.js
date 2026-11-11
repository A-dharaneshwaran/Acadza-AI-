const express = require('express');
const InvestigationCase = require('../models/InvestigationCase');
const Question = require('../models/Question');
const Taxonomy = require('../models/Taxonomy');

const router = express.Router();

/**
 * GET /api/cases
 * Returns all investigation cases grouped by question, sorted by urgency
 * (higher report count first, then most recently reported).
 */
router.get('/cases', async (req, res) => {
  try {
    const cases = await InvestigationCase.find({})
      .sort({ reportCount: -1, lastReportedAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: cases.length,
      cases
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve investigation cases',
      error: err.message
    });
  }
});

/**
 * GET /api/cases/:caseId
 * Returns full case details, including the complete original question record
 * (with HTML, MathML, options, and solution).
 */
router.get('/cases/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    let invCase = await InvestigationCase.findOne({ caseId }).lean();
    if (!invCase) {
      // Allow lookup by questionId as well
      invCase = await InvestigationCase.findOne({ questionId: caseId }).lean();
    }

    if (!invCase) {
      return res.status(404).json({
        success: false,
        message: `Investigation case '${caseId}' not found.`
      });
    }

    const question = await Question.findById(invCase.questionId).lean();
    const taxonomy = await Taxonomy.findById('acadza_taxonomy_v1').lean();

    return res.json({
      success: true,
      case: invCase,
      question: question || null,
      taxonomy: taxonomy || null
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve case details',
      error: err.message
    });
  }
});

/**
 * GET /api/taxonomy
 * Returns authoritative taxonomy verdicts and repair definitions.
 */
router.get('/taxonomy', async (req, res) => {
  try {
    const taxonomy = await Taxonomy.findById('acadza_taxonomy_v1').lean();
    if (!taxonomy) {
      return res.status(404).json({
        success: false,
        message: 'Taxonomy rules not found in database.'
      });
    }
    return res.json({
      success: true,
      verdicts: taxonomy.verdicts,
      repairs: taxonomy.repairs,
      about: taxonomy._about
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve taxonomy',
      error: err.message
    });
  }
});

module.exports = router;

