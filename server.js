require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

const talentRoutes = require('./routes/talent');

const app  = express();
const PORT = process.env.PORT || 5000;

/* ── Middleware ── */
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

/* ── Serve frontend static files ── */
// index.html lives in /public — Express serves it automatically
app.use(express.static(path.join(__dirname, 'public')));

/* ── API Routes ── */
app.use('/api/talent', talentRoutes);

/* ── Health check ── */
app.get('/api/health', (req, res) => {
  res.json({
    status:    'ok',
    message:   'Talent Form API is running',
    version:   '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      submit:       'POST   /api/talent/apply',
      listAll:      'GET    /api/talent/applications',
      getOne:       'GET    /api/talent/applications/:id',
      updateStatus: 'PATCH  /api/talent/applications/:id/status',
      delete:       'DELETE /api/talent/applications/:id',
    },
  });
});

/* ── Catch-all: serve index.html for any non-API route ── */
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ── 404 for unmatched API routes ── */
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

/* ── Global error handler ── */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

/* ── Connect to MongoDB then start server ── */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected:', process.env.MONGO_URI?.split('@')[1] ?? 'localhost');
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📋 Health check:    GET  http://localhost:${PORT}/api/health`);
      console.log(`📋 Submit form:     POST http://localhost:${PORT}/api/talent/apply`);
      console.log(`📋 List applicants: GET  http://localhost:${PORT}/api/talent/applications`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });