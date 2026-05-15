const express   = require('express');
const Applicant = require('../models/Applicant');
const router    = express.Router();

/* ────────────────────────────────────────
   POST /api/talent/apply
   Receives the nested payload from the HTML form and flattens it
   before saving to MongoDB.
──────────────────────────────────────── */
router.post('/apply', async (req, res) => {
  try {
    const { applicant, skills, preferences, meta } = req.body;

    // Validate required fields
    if (!applicant?.first_name || !applicant?.last_name || !applicant?.email) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and email are required.',
      });
    }
    if (!skills?.primary_role || !skills?.years_experience) {
      return res.status(400).json({
        success: false,
        message: 'Primary role and years of experience are required.',
      });
    }

    // Flatten nested payload into one document
    const doc = new Applicant({
      // Personal
      first_name: applicant.first_name,
      last_name:  applicant.last_name,
      email:      applicant.email,
      phone:      applicant.phone,
      summary:    applicant.summary,

      // Skills
      skills:            skills.selected      || [],
      primary_role:      skills.primary_role,
      years_experience:  skills.years_experience,
      proficiency_score: skills.proficiency_score,

      // Preferences
      work_arrangement:   preferences?.work_arrangement,
      employment_type:    preferences?.employment_type,
      availability:       preferences?.availability,
      expected_salary:    preferences?.expected_salary,
      preferred_industry: preferences?.preferred_industry,
      notes:              preferences?.notes,

      // Meta
      ref:          meta?.ref,
      form_version: meta?.form_version,
      submitted_at: meta?.submitted_at ? new Date(meta.submitted_at) : new Date(),
    });

    await doc.save();

    res.status(201).json({
      success: true,
      message: 'Application submitted!',
      ref:     doc.ref,
      id:      doc._id,
    });

  } catch (err) {
    console.error('POST /apply error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
});

/* ────────────────────────────────────────
   GET /api/talent/applications
   List all applications (newest first)
──────────────────────────────────────── */
router.get('/applications', async (req, res) => {
  try {
    const { status, limit = 50, skip = 0 } = req.query;
    const filter = status ? { status } : {};

    const applicants = await Applicant.find(filter)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    const total = await Applicant.countDocuments(filter);

    res.json({ success: true, total, applicants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ────────────────────────────────────────
   GET /api/talent/applications/:id
──────────────────────────────────────── */
router.get('/applications/:id', async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) {
      return res.status(404).json({ success: false, message: 'Applicant not found.' });
    }
    res.json({ success: true, applicant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ────────────────────────────────────────
   PATCH /api/talent/applications/:id/status
   Body: { "status": "shortlisted" }
──────────────────────────────────────── */
router.patch('/applications/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'reviewing', 'shortlisted', 'rejected', 'hired'];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowed.join(', ')}`,
      });
    }

    const applicant = await Applicant.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!applicant) {
      return res.status(404).json({ success: false, message: 'Applicant not found.' });
    }

    res.json({ success: true, message: 'Status updated.', applicant });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/* ────────────────────────────────────────
   DELETE /api/talent/applications/:id
──────────────────────────────────────── */
router.delete('/applications/:id', async (req, res) => {
  try {
    const applicant = await Applicant.findByIdAndDelete(req.params.id);
    if (!applicant) {
      return res.status(404).json({ success: false, message: 'Applicant not found.' });
    }
    res.json({ success: true, message: 'Application deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;