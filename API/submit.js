const express  = require('express');
const router   = express.Router();
const Applicant = require('../routes/Applicant');

/* ─────────────────────────────────────────
   POST /api/talent/apply
   Submit a new talent application
───────────────────────────────────────── */
router.post('/apply', async (req, res) => {
  try {
    const { applicant, skills, preferences, meta } = req.body;

    // Basic field validation
    if (!applicant?.first_name || !applicant?.last_name) {
      return res.status(400).json({ success: false, message: 'First and last name are required.' });
    }
    if (!applicant?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicant.email)) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }
    if (!applicant?.summary) {
      return res.status(400).json({ success: false, message: 'Professional summary is required.' });
    }
    if (!skills?.primary_role) {
      return res.status(400).json({ success: false, message: 'Primary role is required.' });
    }
    if (!skills?.years_experience) {
      return res.status(400).json({ success: false, message: 'Years of experience is required.' });
    }

    // Check for duplicate email
    const existing = await Applicant.findOne({ 'applicant.email': applicant.email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An application with this email already exists.',
        ref: existing.meta.ref,
      });
    }

    // Create and save
    const newApplicant = new Applicant({
      applicant,
      skills,
      preferences,
      meta: {
        ref: meta?.ref || 'REF-' + Date.now(),
        form_version: meta?.form_version || '1.0.0',
      },
    });

    const saved = await newApplicant.save();

    return res.status(201).json({
      success: true,
      message: 'Application received successfully!',
      ref: saved.meta.ref,
      id: saved._id,
    });
  } catch (err) {
    console.error('POST /apply error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

/* ─────────────────────────────────────────
   GET /api/talent/applications
   List all applications (for admin/Postman)
───────────────────────────────────────── */
router.get('/applications', async (req, res) => {
  try {
    const { status, role, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (role)   filter['skills.primary_role'] = role;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Applicant.countDocuments(filter);
    const data  = await Applicant.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data,
    });
  } catch (err) {
    console.error('GET /applications error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

/* ─────────────────────────────────────────
   GET /api/talent/applications/:id
   Get a single application by MongoDB _id
───────────────────────────────────────── */
router.get('/applications/:id', async (req, res) => {
  try {
    const doc = await Applicant.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Application not found.' });
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

/* ─────────────────────────────────────────
   PATCH /api/talent/applications/:id/status
   Update application status
───────────────────────────────────────── */
router.patch('/applications/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'reviewed', 'shortlisted', 'rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }
    const updated = await Applicant.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Application not found.' });
    return res.status(200).json({ success: true, message: 'Status updated.', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

/* ─────────────────────────────────────────
   DELETE /api/talent/applications/:id
   Delete an application
───────────────────────────────────────── */
router.delete('/applications/:id', async (req, res) => {
  try {
    const deleted = await Applicant.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Application not found.' });
    return res.status(200).json({ success: true, message: 'Application deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;