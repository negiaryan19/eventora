const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dns = require('dns');
const https = require('https');
const axios = require('axios');
require('dotenv').config();
const path = require('path');

// --- BYPASS ISP DNS BLOCKS (India TMDB/Gemini Fix) ---
dns.setServers(['8.8.8.8', '8.8.4.4']);
const customLookup = (hostname, options, callback) => {
  dns.resolve4(hostname, (err, addresses) => {
    if (err || !addresses.length) {
      return dns.lookup(hostname, options, callback); // fallback
    }
    callback(null, addresses[0], 4);
  });
};
axios.defaults.httpsAgent = new https.Agent({ lookup: customLookup });
// ------------------------------------------------------

const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const eventRoutes = require('./routes/events');
const aiRoutes = require('./routes/ai');
const bookingRoutes = require('./routes/booking');
const favoriteRoutes = require('./routes/favorites');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/favorites', favoriteRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Catch-all route to serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5001;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Eventora backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
