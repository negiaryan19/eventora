require('dotenv').config();
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');

const app = express();
app.use(cors({
  origin: process.env.CLIENT_URL, // Allow only your frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// connect mongodb
mongoose.connect(process.env.MONGO_URI)
  .then(()=> console.log('Mongo connected'))
  .catch(err => { console.error('Mongo connection error', err); process.exit(1); });

// Routes: note: only /signup, /login, /request-reset, /reset-password are public APIs.
// everything else should require auth (via middleware inside routes).
app.use('/auth', authRoutes);

// protected route
const { requireAuth } = require('./middleware/auth');
app.get('/protected', requireAuth, (req, res) => {
  res.json({ message: `Hello ${req.user.email}, this is protected` });
});

const port = process.env.PORT || 4000;
app.listen(port, ()=> console.log(`Server running on ${port}`));
