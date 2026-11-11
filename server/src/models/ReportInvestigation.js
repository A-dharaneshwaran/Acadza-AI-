const mongoose = require('mongoose');

const facultyDecisionSchema = new mongoose.Schema({
  decision: {
    type: String,
    enum: ['approved', 'rejected', 'modified'],
    required: true
  },
  reviewedBy: {
    type: String,
    required: true // Strictly required: cannot be defaulted or anonymous
  },
  reviewedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  },
  appliedEdit: {
    field: { type: String, default: null },
    find: { type: String, default: null },
    replace: { type: String, default: null }
  }
}, { _id: false });

const reportInvestigationSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  questionId: {
    type: String,
    required: true,
    index: true
  },
  caseId: {
    type: String,
    required: true,
    index: true
  },
  verdict: {
    type: String,
    required: true,
    enum: [
      'defect',
      'no_error',
      'display_issue',
      'app_issue',
      'language_mode',
      'already_fixed',
      'not_actionable'
    ],
    index: true
  },
  repairType: {
    type: String,
    default: null,
    enum: [
      null,
      'spelling',
      'noise',
      'exam_reference',
      'markup_leak',
      'answer_form',
      'notation',
      'stem_data',
      'option_repair',
      'solution_fix',
      'solution_missing',
      'answer_key',
      'type_mismatch',
      'identical_options',
      'diagram',
      'wrong_question',
      'unsound',
      'wrong_chapter',
      'syllabus'
    ]
  },
  evidence: {
    type: String,
    required: true
  },
  reasoning: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  // Auto-eligibility semantics (Phase 06 explicit model)
  taxonomyAutoEligible: {
    type: Boolean,
    required: true,
    default: false
  },
  requiresFacultyReview: {
    type: Boolean,
    required: true
  },
  safeToApply: {
    type: Boolean,
    required: true,
    default: false
  },
  autoEligible: {
    type: Boolean,
    required: true,
    default: false
  },
  proposedEdit: {
    field: { type: String, default: null },
    find: { type: String, default: null },
    replace: { type: String, default: null }
  },
  studentReplyPreview: {
    type: String,
    default: ''
  },
  injectionDetected: {
    type: Boolean,
    default: false
  },
  injectionEvidence: {
    type: String,
    default: null
  },
  uncertainties: {
    type: [String],
    default: []
  },
  // Explicit human faculty decision preservation
  facultyDecision: {
    type: facultyDecisionSchema,
    default: null
  },
  investigationVersion: {
    type: String,
    default: '6.0-hardened-audit'
  },
  investigatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ReportInvestigation', reportInvestigationSchema);
