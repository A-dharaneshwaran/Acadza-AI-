const mongoose = require('mongoose');

const reportSnapshotSchema = new mongoose.Schema({
  reportId: { type: String, required: true },
  studentId: { type: String, required: true },
  source: { type: String, required: false },
  comment: { type: String, required: false, default: '' },
  reportedAt: { type: Date, required: true },
  injectionRisk: {
    injectionDetected: { type: Boolean, default: false },
    riskLevel: { type: String, enum: ['none', 'low', 'medium', 'high', 'critical'], default: 'none' },
    matchedIndicators: [{ type: mongoose.Schema.Types.Mixed }],
    explanation: { type: String }
  }
}, { _id: false });

const investigationCaseSchema = new mongoose.Schema({
  caseId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  questionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  reportIds: {
    type: [String],
    required: true,
    default: []
  },
  reportCount: {
    type: Number,
    required: true,
    default: 1
  },
  reports: {
    type: [reportSnapshotSchema],
    default: []
  },
  firstReportedAt: {
    type: Date,
    required: true
  },
  lastReportedAt: {
    type: Date,
    required: true
  },
  questionSnapshot: {
    questionType: { type: String, required: true },
    subject: { type: String },
    chapter: { type: String },
    concept: { type: String },
    subConcept: { type: String },
    level: { type: mongoose.Schema.Types.Mixed },
    hasErrorHistory: { type: Boolean, default: false }
  },
  errorHistoryContext: [{
    type: mongoose.Schema.Types.Mixed
  }],
  injectionAnalysis: {
    injectionDetected: { type: Boolean, default: false },
    riskLevel: { type: String, enum: ['none', 'low', 'medium', 'high', 'critical'], default: 'none' },
    summary: { type: String }
  },
  status: {
    type: String,
    required: true,
    enum: [
      'pending_triage',
      'ready_for_ai',
      'ai_processing',
      'ai_completed',
      'needs_faculty_review',
      'failed'
    ],
    default: 'ready_for_ai',
    index: true
  },
  // Placeholders reserved for subsequent phases (Phase 03 AI and Phase 04 Validation)
  triageResult: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  facultyDecision: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.model('InvestigationCase', investigationCaseSchema);

