const express = require('express');
const axios = require('axios');
const https = require('https');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const TMDB_BASE = 'https://api.themoviedb.org/3';

// Configure a robust https agent to avoid DNS/Socket errors like ECONNRESET
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  rejectUnauthorized: false
});

const axiosInstance = axios.create({
  httpsAgent,
  timeout: 10000 // 10 seconds timeout
});

const tmdbUrl = (pathname, extraParams = '') => {
  return `${TMDB_BASE}${pathname}?api_key=${process.env.TMDB_API_KEY}${extraParams}`;
};

// Helper for fallback
const getFallbackData = () => {
  try {
    const fallbackPath = path.join(__dirname, '../utils/tmdbFallback.json');
    const data = fs.readFileSync(fallbackPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Fallback read error:', err.message);
    return { results: [] };
  }
};

const fetchTMDB = async (url) => {
  try {
    const { data } = await axiosInstance.get(url);
    return data;
  } catch (err) {
    console.error(`TMDB fetch error for ${url}:`, err.message);
    // If connection error occurs, use fallback
    if (err.code === 'ECONNRESET' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
      console.log('Using fallback TMDB data');
      return getFallbackData();
    }
    throw err;
  }
};

// GET /api/movies/trending
router.get('/trending', async (req, res) => {
  try {
    const data = await fetchTMDB(tmdbUrl('/trending/movie/week'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/upcoming
router.get('/upcoming', async (req, res) => {
  try {
    const data = await fetchTMDB(tmdbUrl('/movie/upcoming'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/toprated
router.get('/toprated', async (req, res) => {
  try {
    const data = await fetchTMDB(tmdbUrl('/movie/top_rated'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/nowplaying
router.get('/nowplaying', async (req, res) => {
  try {
    const data = await fetchTMDB(tmdbUrl('/movie/now_playing'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/search?q=
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required.' });
    }
    const data = await fetchTMDB(
      tmdbUrl('/search/movie', `&query=${encodeURIComponent(query)}`)
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/:id
router.get('/:id', async (req, res) => {
  try {
    const movieId = req.params.id;
    const [details, credits, videos] = await Promise.all([
      fetchTMDB(tmdbUrl(`/movie/${movieId}`)).catch(() => ({})),
      fetchTMDB(tmdbUrl(`/movie/${movieId}/credits`)).catch(() => ({})),
      fetchTMDB(tmdbUrl(`/movie/${movieId}/videos`)).catch(() => ({})),
    ]);

    const cast = credits.cast ? credits.cast.slice(0, 10) : [];
    const videoList = videos.results || [];
    const trailer = videoList.find(
      (v) => v.site === 'YouTube' && v.type === 'Trailer'
    );

    res.json({
      ...details,
      cast,
      trailerKey: trailer ? trailer.key : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/:id/similar
router.get('/:id/similar', async (req, res) => {
  try {
    const data = await fetchTMDB(tmdbUrl(`/movie/${req.params.id}/similar`));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
