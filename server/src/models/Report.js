const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
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
  studentId: { 
    type: String, 
    required: true 
  },
  source: { 
    type: String, 
    required: false 
  },
  reportedAt: { 
    type: Date, 
    required: true 
  },
  comment: { 
    type: String, 
    required: false, 
    default: '' 
  }
}, {
  timestamps: true,
  strict: false // preserve unknown fields
});

module.exports = mongoose.model('Report', reportSchema);

