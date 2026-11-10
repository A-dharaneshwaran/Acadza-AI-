const mongoose = require('mongoose');

const errorHistoryItemSchema = new mongoose.Schema({
  type: { type: String, required: false },
  actor: { type: String, required: false },
  at: { type: Date, required: false },
  note: { type: String, required: false }
}, { _id: false, strict: false });

const subQuestionSchema = new mongoose.Schema({
  question: { type: String, required: false },
  solution: { type: String, required: false },
  answer: { type: mongoose.Schema.Types.Mixed, required: false },
  quesImages: { type: [String], default: [] },
  solutionImages: { type: [String], default: [] }
}, { _id: false, strict: false });

const questionSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Preserving original ObjectId string like '60ca4feb6420652745f55522'
  qid: { type: String, required: false },
  questionType: { 
    type: String, 
    required: true, 
    enum: ['scq', 'mcq', 'integerQuestion'] 
  },
  subject: { type: String, required: false },
  chapter: { type: String, required: false },
  concept: { type: String, required: false },
  subConcept: { type: String, required: false },
  level: { type: mongoose.Schema.Types.Mixed, required: false },
  error: { type: Boolean, default: false },
  updatedAt: { type: Date, required: false },
  errorHistory: { type: [errorHistoryItemSchema], default: [] },
  scq: { type: subQuestionSchema, required: false },
  mcq: { type: subQuestionSchema, required: false },
  integerQuestion: { type: subQuestionSchema, required: false }
}, {
  timestamps: true,
  strict: false // preserve unknown fields as mandated
});

module.exports = mongoose.model('Question', questionSchema);

