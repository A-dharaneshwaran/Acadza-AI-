const mongoose = require('mongoose');

const repairRuleSchema = new mongoose.Schema({
  fields: { type: [String], default: [] },
  auto: { type: Boolean, required: true },
  label: { type: String, required: true }
}, { _id: false });

const taxonomySchema = new mongoose.Schema({
  _id: { type: String, default: 'acadza_taxonomy_v1' },
  _about: { type: String, required: false },
  verdicts: { 
    type: Map, 
    of: String, 
    required: true 
  },
  repairs: { 
    type: Map, 
    of: repairRuleSchema, 
    required: true 
  }
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.model('Taxonomy', taxonomySchema);

