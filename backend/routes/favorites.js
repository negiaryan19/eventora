const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// POST /api/favorites/toggle
router.post('/toggle', auth, async (req, res) => {
  try {
    const { movieId } = req.body;

    if (!movieId) {
      return res.status(400).json({ error: 'movieId is required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const index = user.favorites.indexOf(movieId);
    if (index > -1) {
      user.favorites.splice(index, 1);
    } else {
      user.favorites.push(movieId);
    }

    await user.save();
    res.json({ favorites: user.favorites });
  } catch (err) {
    console.error('Toggle favorite error:', err);
    res.status(500).json({ error: 'Failed to toggle favorite.' });
  }
});

// GET /api/favorites
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('favorites');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ favorites: user.favorites });
  } catch (err) {
    console.error('Get favorites error:', err);
    res.status(500).json({ error: 'Failed to fetch favorites.' });
  }
});

module.exports = router;
