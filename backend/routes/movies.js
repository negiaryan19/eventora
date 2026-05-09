const express = require('express');
const axios = require('axios');

const router = express.Router();
const TMDB_BASE = 'https://api.themoviedb.org/3';

function tmdbUrl(path, extraParams = '') {
  return `${TMDB_BASE}${path}?api_key=${process.env.TMDB_API_KEY}${extraParams}`;
}

// GET /api/movies/trending
router.get('/trending', async (req, res) => {
  try {
    const { data } = await axios.get(tmdbUrl('/trending/movie/week'));
    res.json(data);
  } catch (err) {
    console.error('TMDB trending error:', err.message);
    res.status(500).json({ error: 'Failed to fetch trending movies.' });
  }
});

// GET /api/movies/upcoming
router.get('/upcoming', async (req, res) => {
  try {
    const { data } = await axios.get(tmdbUrl('/movie/upcoming'));
    res.json(data);
  } catch (err) {
    console.error('TMDB upcoming error:', err.message);
    res.status(500).json({ error: 'Failed to fetch upcoming movies.' });
  }
});

// GET /api/movies/toprated
router.get('/toprated', async (req, res) => {
  try {
    const { data } = await axios.get(tmdbUrl('/movie/top_rated'));
    res.json(data);
  } catch (err) {
    console.error('TMDB top rated error:', err.message);
    res.status(500).json({ error: 'Failed to fetch top rated movies.' });
  }
});

// GET /api/movies/nowplaying
router.get('/nowplaying', async (req, res) => {
  try {
    const { data } = await axios.get(tmdbUrl('/movie/now_playing'));
    res.json(data);
  } catch (err) {
    console.error('TMDB now playing error:', err.message);
    res.status(500).json({ error: 'Failed to fetch now playing movies.' });
  }
});

// GET /api/movies/search?q=
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required.' });
    }
    const { data } = await axios.get(
      tmdbUrl('/search/movie', `&query=${encodeURIComponent(query)}`)
    );
    res.json(data);
  } catch (err) {
    console.error('TMDB search error:', err.message);
    res.status(500).json({ error: 'Failed to search movies.' });
  }
});

// GET /api/movies/:id
router.get('/:id', async (req, res) => {
  try {
    const movieId = req.params.id;
    const [detailsRes, creditsRes, videosRes] = await Promise.all([
      axios.get(tmdbUrl(`/movie/${movieId}`)),
      axios.get(tmdbUrl(`/movie/${movieId}/credits`)),
      axios.get(tmdbUrl(`/movie/${movieId}/videos`)),
    ]);

    const movie = detailsRes.data;
    const cast = creditsRes.data.cast ? creditsRes.data.cast.slice(0, 10) : [];
    const videos = videosRes.data.results || [];
    const trailer = videos.find(
      (v) => v.site === 'YouTube' && v.type === 'Trailer'
    );

    res.json({
      ...movie,
      cast,
      trailerKey: trailer ? trailer.key : null,
    });
  } catch (err) {
    console.error('TMDB movie detail error:', err.message);
    res.status(500).json({ error: 'Failed to fetch movie details.' });
  }
});

// GET /api/movies/:id/similar
router.get('/:id/similar', async (req, res) => {
  try {
    const { data } = await axios.get(tmdbUrl(`/movie/${req.params.id}/similar`));
    res.json(data);
  } catch (err) {
    console.error('TMDB similar error:', err.message);
    res.status(500).json({ error: 'Failed to fetch similar movies.' });
  }
});

module.exports = router;
