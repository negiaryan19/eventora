const express = require('express');
const axios = require('axios');

const router = express.Router();

const MOVIEGLU_BASE = (process.env.MOVIEGLU_BASE_URL || 'https://api-gate2.movieglu.com/').replace(/\/?$/, '/');
const DEFAULT_GEOLOCATION = {
  Bengaluru: '12.9716;77.5946',
  Bangalore: '12.9716;77.5946',
  Delhi: '28.6139;77.2090',
  Mumbai: '19.0760;72.8777',
  Chennai: '13.0827;80.2707',
  Hyderabad: '17.3850;78.4867',
  Pune: '18.5204;73.8567',
};

const FALLBACK_SHOWTIMES = [
  {
    name: 'PVR: Orion Mall, Dr Rajkumar Road',
    city: 'Bengaluru',
    screen: 'Audi 4',
    format: 'ATMOS',
    language: '2D',
    showtimes: ['07:25 PM', '10:30 PM'],
    bookingProvider: 'PVR',
  },
  {
    name: 'INOX: Megaplex Mall of Asia Bangalore',
    city: 'Bengaluru',
    screen: 'Insignia',
    format: 'Laser',
    language: '2D',
    showtimes: ['07:15 PM', '09:30 PM', '10:20 PM'],
    bookingProvider: 'INOX',
  },
  {
    name: 'Cinepolis: Nexus Shantiniketan',
    city: 'Bengaluru',
    screen: 'Screen 3',
    format: 'Dolby 7.1',
    language: '2D',
    showtimes: ['07:20 PM', '10:30 PM'],
    bookingProvider: 'Cinepolis',
  },
];

const movieLanguages = new Map([
  ['dhurandhar', 'Hindi - 2D'],
  ['dhurandar', 'Hindi - 2D'],
  ['jawan', 'Hindi - 2D'],
  ['rrr', 'Telugu / Hindi - 2D'],
  ['karuppu', 'Tamil - 2D'],
]);

function todayInIndia() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function normalize(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function formatTime(value) {
  if (!value) return null;

  const [hourValue, minuteValue] = String(value).split(':');
  const hour = Number(hourValue);
  const minute = Number(minuteValue || 0);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return value;
  }

  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
}

function languageForMovie(movieTitle = '') {
  const key = normalize(movieTitle);
  return movieLanguages.get(key) || '2D';
}

function fallbackResponse({ movieTitle, city, date, reason }) {
  const language = languageForMovie(movieTitle);

  return {
    source: 'demo_fallback',
    live: false,
    provider: null,
    date,
    city,
    message: reason || 'Live showtime provider is not configured yet.',
    venues: FALLBACK_SHOWTIMES.map((venue) => ({
      ...venue,
      city: city || venue.city,
      language,
      isLive: false,
    })),
  };
}

function hasMovieGluConfig() {
  return Boolean(
    process.env.MOVIEGLU_CLIENT
    && process.env.MOVIEGLU_API_KEY
    && process.env.MOVIEGLU_AUTH
    && process.env.MOVIEGLU_TERRITORY
  );
}

function movieGluHeaders(city) {
  const geolocation = process.env.MOVIEGLU_GEOLOCATION
    || DEFAULT_GEOLOCATION[city]
    || DEFAULT_GEOLOCATION.Bengaluru;

  return {
    client: process.env.MOVIEGLU_CLIENT,
    'x-api-key': process.env.MOVIEGLU_API_KEY,
    authorization: process.env.MOVIEGLU_AUTH,
    territory: process.env.MOVIEGLU_TERRITORY || 'IN',
    'api-version': process.env.MOVIEGLU_API_VERSION || 'v200',
    geolocation,
    'device-datetime': new Date().toISOString(),
  };
}

async function movieGluGet(pathname, params, city) {
  const { data } = await axios.get(`${MOVIEGLU_BASE}${pathname}`, {
    params,
    headers: movieGluHeaders(city),
    timeout: 10000,
  });

  return data;
}

async function findMovieGluFilm(movieTitle, city) {
  const data = await movieGluGet('filmLiveSearch/', {
    query: movieTitle,
    n: 8,
  }, city);

  const films = data.films || [];
  const exact = films.find((film) => normalize(film.film_name) === normalize(movieTitle));
  return exact || films[0] || null;
}

function normalizeMovieGluVenues(data, city) {
  return (data.cinemas || [])
    .map((cinema) => {
      const formats = Object.entries(cinema.showings || {});
      const firstFormat = formats[0]?.[0] || 'Standard';
      const showtimes = formats.flatMap(([, showing]) => (
        showing.times || []
      ).map((time) => formatTime(time.start_time)).filter(Boolean));

      return {
        name: cinema.cinema_name,
        city: cinema.city || city,
        screen: firstFormat,
        format: firstFormat,
        language: firstFormat,
        showtimes: [...new Set(showtimes)].slice(0, 8),
        distance: cinema.distance,
        logoUrl: cinema.logo_url,
        bookingProvider: 'MovieGlu',
        isLive: true,
      };
    })
    .filter((venue) => venue.name && venue.showtimes.length);
}

// GET /api/showtimes?movieTitle=&city=&date=
router.get('/', async (req, res) => {
  const movieTitle = String(req.query.movieTitle || '').trim();
  const city = String(req.query.city || 'Bengaluru').trim();
  const date = String(req.query.date || todayInIndia()).trim();

  if (!hasMovieGluConfig()) {
    return res.json(fallbackResponse({
      movieTitle,
      city,
      date,
      reason: 'Demo showtimes shown. Add MovieGlu or official cinema credentials for live PVR/INOX availability.',
    }));
  }

  if (!movieTitle) {
    return res.json(fallbackResponse({
      movieTitle,
      city,
      date,
      reason: 'Movie title is required before live showtimes can be matched.',
    }));
  }

  try {
    const film = await findMovieGluFilm(movieTitle, city);

    if (!film?.film_id) {
      return res.json(fallbackResponse({
        movieTitle,
        city,
        date,
        reason: 'Live provider did not find showtimes for this movie.',
      }));
    }

    const showtimeData = await movieGluGet('filmShowTimes/', {
      film_id: film.film_id,
      date,
      n: 10,
    }, city);
    const venues = normalizeMovieGluVenues(showtimeData, city);

    if (!venues.length) {
      return res.json(fallbackResponse({
        movieTitle,
        city,
        date,
        reason: 'Live provider returned no active showtimes for this date.',
      }));
    }

    res.json({
      source: 'movieglu_live',
      live: true,
      provider: 'MovieGlu',
      date,
      city,
      movieGluFilmId: film.film_id,
      message: 'Live showtimes loaded.',
      venues,
    });
  } catch (err) {
    console.error('Showtime provider error:', err.message);
    res.json(fallbackResponse({
      movieTitle,
      city,
      date,
      reason: 'Live showtime provider failed, so demo showtimes are shown.',
    }));
  }
});

module.exports = router;
