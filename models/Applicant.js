const mongoose = require('mongoose');

const ApplicantSchema = new mongoose.Schema({
  // ── Personal
  first_name: { type: String, required: true, trim: true },
  last_name:  { type: String, required: true, trim: true },
  email:      { type: String, required: true, trim: true, lowercase: true },
  phone:      { type: String, trim: true },
  summary:    { type: String, trim: true },

  // ── Skills
  skills:            [String],
  primary_role:      { type: String },
  years_experience:  { type: String },
  proficiency_score: { type: Number, min: 1, max: 10 },

  // ── Preferences
  work_arrangement:   { type: String },
  employment_type:    { type: String },
  availability:       { type: String },
  expected_salary:    { type: String },
  preferred_industry: { type: String },
  notes:              { type: String },

  // ── Meta
  ref:          { type: String },
  form_version: { type: String },
  submitted_at: { type: Date, default: Date.now },

  // ── Status (for admin use)
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'shortlisted', 'rejected', 'hired'],
    default: 'pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('Applicant', ApplicantSchema);