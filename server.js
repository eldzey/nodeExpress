require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const talentRoutes = require('./routes/talent');

const app = express();
const PORT = process.env.PORT || 5000;

/* ─────────────────────────────────────────────
   Middleware
───────────────────────────────────────────── */
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

/* ─────────────────────────────────────────────
   Serve Frontend Files
───────────────────────────────────────────── */
app.use(express.static(path.join(__dirname, 'public')));

/* ─────────────────────────────────────────────
   API Routes
───────────────────────────────────────────── */
app.use('/api/talent', talentRoutes);

/* ─────────────────────────────────────────────
   Health Check
───────────────────────────────────────────── */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    message: 'Talent Form API is running',
    timestamp: new Date().toISOString(),
  });
});

/* ─────────────────────────────────────────────
   Catch-All Route for Frontend
───────────────────────────────────────────── */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ─────────────────────────────────────────────
   404 Handler
───────────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

/* ─────────────────────────────────────────────
   Global Error Handler
───────────────────────────────────────────── */
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

/* ─────────────────────────────────────────────
   MongoDB Connection
───────────────────────────────────────────── */
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully');

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 Health: http://localhost:${PORT}/api/health`);
  });
})
.catch((err) => {
  console.error('❌ MongoDB Connection Failed');
  console.error(err.message);
  process.exit(1);
});