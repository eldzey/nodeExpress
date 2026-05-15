require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

/* ─────────────────────────────────────────────
   Environment Variables
───────────────────────────────────────────── */
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

/* ─────────────────────────────────────────────
   Debug: Print MONGO_URI
───────────────────────────────────────────── */
console.log('🔎 MONGO_URI from env:', MONGO_URI);

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is missing in Render Environment Variables');
  process.exit(1);
}

/* ─────────────────────────────────────────────
   Middleware
───────────────────────────────────────────── */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ─────────────────────────────────────────────
   Static Files
───────────────────────────────────────────── */
app.use(express.static(path.join(__dirname, 'public')));

/* ─────────────────────────────────────────────
   Routes
───────────────────────────────────────────── */
try {
  const talentRoutes = require('./routes/talent');
  app.use('/api/talent', talentRoutes);
} catch (err) {
  console.error('❌ Cannot load routes/talent.js');
  console.error(err.message);
}

/* ─────────────────────────────────────────────
   Health Route
───────────────────────────────────────────── */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    mongodb: mongoose.connection.readyState === 1
      ? 'connected'
      : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

/* ─────────────────────────────────────────────
   Homepage
───────────────────────────────────────────── */
app.get('/', (req, res) => {
  res.send('Talent Form Backend Running');
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
   Error Handler
───────────────────────────────────────────── */
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);

  res.status(500).json({
    success: false,
    error: err.message,
  });
});

/* ─────────────────────────────────────────────
   MongoDB Connection
───────────────────────────────────────────── */
mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
})
.then(() => {
  console.log('✅ MongoDB Connected');

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
  });
})
.catch((err) => {
  console.error('❌ MongoDB Connection Failed');
  console.error(err.message);
  process.exit(1);
});
