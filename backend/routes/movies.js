const express = require('express');
const axios = require('axios');
const https = require('https');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const TMDB_BASE = 'https://api.themoviedb.org/3';
const FALLBACK_ID_ALIASES = {
  900001: '1367220',
};

const GENRES = {
  12: 'Adventure',
  14: 'Fantasy',
  16: 'Animation',
  18: 'Drama',
  27: 'Horror',
  28: 'Action',
  35: 'Comedy',
  36: 'History',
  53: 'Thriller',
  80: 'Crime',
  878: 'Science Fiction',
  9648: 'Mystery',
  10749: 'Romance',
};

const FALLBACK_SECTION_IDS = {
  trending: [1367220, 1291608, 872906, 693134, 823464, 872585],
  nowplaying: [1022789, 579974, 569094, 545611, 414906, 346698, 76600],
  upcoming: [299534, 496243, 157336, 27205, 155, 603],
};

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
});

const axiosInstance = axios.create({
  httpsAgent,
  timeout: 10000,
});

const tmdbUrl = (pathname, extraParams = '') => {
  return `${TMDB_BASE}${pathname}?api_key=${process.env.TMDB_API_KEY}${extraParams}`;
};

const redactTmdbUrl = (url) => {
  return url.replace(/api_key=[^&]+/, 'api_key=***');
};

const getFallbackMovies = () => {
  try {
    const fallbackPath = path.join(__dirname, '../utils/tmdbFallback.json');
    const data = fs.readFileSync(fallbackPath, 'utf8');
    return JSON.parse(data).results || [];
  } catch (err) {
    console.error('Fallback read error:', err.message);
    return [];
  }
};

const toMovieListResponse = (results) => ({
  page: 1,
  results,
  total_pages: 1,
  total_results: results.length,
  source: 'fallback',
});

const normalizeSearchValue = (value) => {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
};

const searchMatches = (query, value) => {
  const normalizedQuery = normalizeSearchValue(query);
  const normalizedValue = normalizeSearchValue(value);

  if (!normalizedQuery || !normalizedValue) {
    return false;
  }

  return normalizedValue.includes(normalizedQuery)
    || normalizedValue.replace(/h/g, '').includes(normalizedQuery.replace(/h/g, ''));
};

const parseReleaseDate = (movie) => {
  const parsed = new Date(movie.release_date);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
};

const byCuratedIds = (movies, ids) => {
  const byId = new Map(movies.map((movie) => [Number(movie.id), movie]));
  const curated = ids.map((id) => byId.get(id)).filter(Boolean);

  return curated.length ? curated : movies;
};

const sortFallbackMovies = (movies, mode) => {
  const items = [...movies];

  if (mode === 'toprated') {
    return items.sort((a, b) => b.vote_average - a.vote_average);
  }

  if (mode === 'upcoming') {
    const today = new Date();
    const future = items
      .filter((movie) => parseReleaseDate(movie) > today)
      .sort((a, b) => parseReleaseDate(a) - parseReleaseDate(b));

    if (future.length) {
      return future;
    }

    return byCuratedIds(items, FALLBACK_SECTION_IDS.upcoming);
  }

  if (mode === 'nowplaying') {
    return byCuratedIds(items, FALLBACK_SECTION_IDS.nowplaying);
  }

  return byCuratedIds(items, FALLBACK_SECTION_IDS.trending);
};

const fallbackList = (mode = 'trending') => {
  return toMovieListResponse(sortFallbackMovies(getFallbackMovies(), mode));
};

const hasTitleOrAliasMatch = (movie, query) => {
  return [
    movie.title,
    ...(movie.aliases || []),
  ]
    .filter(Boolean)
    .some((value) => searchMatches(query, value));
};

const mergeMovieResults = (primary = [], secondary = []) => {
  const seen = new Set();

  return [...primary, ...secondary].filter((movie) => {
    const key = String(movie.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const fallbackSearch = (query, { titleOnly = false } = {}) => {
  const needle = String(query || '').trim().toLowerCase();
  const movies = getFallbackMovies();

  if (!needle) {
    return toMovieListResponse([]);
  }

  const results = movies.filter((movie) => {
    if (titleOnly) {
      return hasTitleOrAliasMatch(movie, needle);
    }

    return [
      movie.title,
      movie.overview,
      movie.language,
      ...(movie.aliases || []),
      ...(movie.cast || []).map((person) => person.name),
      ...(movie.genre_ids || []).map((genreId) => GENRES[genreId]),
    ]
      .filter(Boolean)
      .some((value) => searchMatches(needle, value));
  });

  return toMovieListResponse(results);
};

const fallbackMovieDetails = (id) => {
  const movies = getFallbackMovies();
  const lookupId = FALLBACK_ID_ALIASES[String(id)] || String(id);
  const movie = movies.find((item) => String(item.id) === lookupId);

  if (!movie) {
    return null;
  }

  return {
    ...movie,
    genres: (movie.genre_ids || []).map((genreId) => ({
      id: genreId,
      name: GENRES[genreId] || 'Movie',
    })),
    cast: movie.cast || [],
    trailerKey: movie.trailerKey || null,
    trailerSearchQuery: movie.trailerSearchQuery || `${movie.title} official trailer`,
    source: 'fallback',
  };
};

const fallbackSimilar = (id) => {
  const movie = fallbackMovieDetails(id);
  const movies = getFallbackMovies();

  if (!movie) {
    return toMovieListResponse(sortFallbackMovies(movies, 'trending').slice(0, 8));
  }

  const genres = new Set(movie.genre_ids || []);
  const results = movies
    .filter((item) => String(item.id) !== String(id))
    .map((item) => ({
      item,
      score: (item.genre_ids || []).filter((genreId) => genres.has(genreId)).length,
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.item.vote_average - a.item.vote_average)
    .map(({ item }) => item)
    .slice(0, 12);

  return toMovieListResponse(results.length ? results : sortFallbackMovies(movies, 'trending').slice(0, 8));
};

const fetchTMDB = async (url, fallbackFactory) => {
  if (!process.env.TMDB_API_KEY) {
    return fallbackFactory();
  }

  try {
    const { data } = await axiosInstance.get(url);
    return data;
  } catch (err) {
    console.error(`TMDB fetch error for ${redactTmdbUrl(url)}:`, err.message);

    if (err.code === 'ECONNRESET' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
      console.log('Using local movie fallback data');
      return fallbackFactory();
    }

    throw err;
  }
};

// GET /api/movies/trending
router.get('/trending', async (req, res) => {
  try {
    const data = await fetchTMDB(
      tmdbUrl('/trending/movie/week'),
      () => fallbackList('trending')
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/upcoming
router.get('/upcoming', async (req, res) => {
  try {
    const data = await fetchTMDB(
      tmdbUrl('/movie/upcoming'),
      () => fallbackList('upcoming')
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/toprated
router.get('/toprated', async (req, res) => {
  try {
    const data = await fetchTMDB(
      tmdbUrl('/movie/top_rated'),
      () => fallbackList('toprated')
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/nowplaying
router.get('/nowplaying', async (req, res) => {
  try {
    const data = await fetchTMDB(
      tmdbUrl('/movie/now_playing'),
      () => fallbackList('nowplaying')
    );
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

    const tmdbData = await fetchTMDB(
      tmdbUrl('/search/movie', `&query=${encodeURIComponent(query)}`),
      () => fallbackSearch(query)
    );
    const fallbackData = fallbackSearch(query, { titleOnly: Boolean(process.env.TMDB_API_KEY) });
    const fallbackHasDirectMatch = fallbackData.results.some((movie) => hasTitleOrAliasMatch(movie, query));
    const results = fallbackHasDirectMatch
      ? mergeMovieResults(fallbackData.results, tmdbData.results)
      : mergeMovieResults(tmdbData.results, fallbackData.results);

    res.json({
      ...tmdbData,
      page: tmdbData.page || 1,
      results,
      total_results: Math.max(tmdbData.total_results || 0, results.length),
      source: tmdbData.source === 'fallback' ? 'fallback' : 'tmdb',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/:id
router.get('/:id', async (req, res) => {
  try {
    const movieId = req.params.id;

    if (!process.env.TMDB_API_KEY) {
      const fallbackMovie = fallbackMovieDetails(movieId);
      if (!fallbackMovie) return res.status(404).json({ error: 'Movie not found.' });
      return res.json(fallbackMovie);
    }

    const [details, credits, videos] = await Promise.all([
      axiosInstance.get(tmdbUrl(`/movie/${movieId}`)).then((resData) => resData.data),
      axiosInstance.get(tmdbUrl(`/movie/${movieId}/credits`)).then((resData) => resData.data),
      axiosInstance.get(tmdbUrl(`/movie/${movieId}/videos`)).then((resData) => resData.data),
    ]);

    const cast = credits.cast ? credits.cast.slice(0, 10) : [];
    const videoList = videos.results || [];
    const trailer = videoList.find(
      (video) => video.site === 'YouTube' && video.type === 'Trailer'
    );

    res.json({
      ...details,
      cast,
      trailerKey: trailer ? trailer.key : null,
    });
  } catch (err) {
    console.error('TMDB detail fetch error:', err.message);
    const fallbackMovie = fallbackMovieDetails(req.params.id);

    if (!fallbackMovie) {
      return res.status(404).json({ error: 'Movie not found.' });
    }

    res.json(fallbackMovie);
  }
});

// GET /api/movies/:id/similar
router.get('/:id/similar', async (req, res) => {
  try {
    const data = await fetchTMDB(
      tmdbUrl(`/movie/${req.params.id}/similar`),
      () => fallbackSimilar(req.params.id)
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
