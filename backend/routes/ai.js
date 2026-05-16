const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const fallbackPlans = [
  {
    title: 'Dhurandhar',
    type: 'movie',
    reason: 'High-energy crime thriller pick with premium evening shows and strong action pacing.',
    venue: 'PVR: Orion Mall, Bengaluru',
    estimatedPrice: 250,
    rating: 7.1,
    emoji: '🎬',
    genres: ['Action', 'Thriller', 'Drama'],
    moods: ['Adventurous', 'Social'],
    cities: ['Bangalore', 'Bengaluru'],
  },
  {
    title: 'Karuppu',
    type: 'movie',
    reason: 'A big-screen Tamil fantasy-action option with a strong star-led theatrical feel.',
    venue: 'INOX: Megaplex Mall of Asia Bangalore',
    estimatedPrice: 250,
    rating: 7.4,
    emoji: '🎟️',
    genres: ['Action', 'Drama', 'Thriller'],
    moods: ['Adventurous', 'Happy'],
    cities: ['Bangalore', 'Bengaluru', 'Chennai'],
  },
  {
    title: 'Rooftop dinner and a late movie',
    type: 'restaurant',
    reason: 'A relaxed plan that keeps the night easy: dinner first, movie after.',
    venue: 'UB City, Bengaluru',
    estimatedPrice: 1200,
    rating: 4.6,
    emoji: '🍽️',
    genres: ['Romance', 'Drama'],
    moods: ['Romantic', 'Chill'],
    cities: ['Bangalore', 'Bengaluru'],
  },
  {
    title: 'Comedy night',
    type: 'comedy',
    reason: 'Light, social, and budget-friendly when you want a plan without too much effort.',
    venue: 'The Habitat / local comedy club',
    estimatedPrice: 499,
    rating: 4.4,
    emoji: '🎤',
    genres: ['Comedy'],
    moods: ['Happy', 'Social', 'Chill'],
    cities: ['Mumbai', 'Delhi', 'Bangalore', 'Bengaluru', 'Pune', 'Hyderabad', 'Chennai'],
  },
  {
    title: 'Premium multiplex night',
    type: 'movie',
    reason: 'Best fit when you want comfortable seats, clean sound, and simple booking.',
    venue: 'PVR / INOX near you',
    estimatedPrice: 450,
    rating: 4.5,
    emoji: '🍿',
    genres: ['Action', 'Drama', 'Thriller', 'Romance', 'Comedy'],
    moods: ['Chill', 'Happy', 'Social', 'Romantic'],
    cities: ['Mumbai', 'Delhi', 'Bangalore', 'Bengaluru', 'Pune', 'Hyderabad', 'Chennai'],
  },
  {
    title: 'Live music lounge',
    type: 'concert',
    reason: 'Good for a social plan with music, food, and a lively crowd.',
    venue: 'City live music venue',
    estimatedPrice: 900,
    rating: 4.3,
    emoji: '🎸',
    genres: ['Romance', 'Drama'],
    moods: ['Social', 'Romantic', 'Happy'],
    cities: ['Mumbai', 'Delhi', 'Bangalore', 'Bengaluru', 'Pune', 'Hyderabad', 'Chennai'],
  },
];

function budgetLimit(value = '') {
  if (value.includes('500') && value.includes('Under')) return 500;
  if (value.includes('1500') && !value.includes('+')) return 1500;
  return Infinity;
}

function buildFallbackRecommendations({ mood, city, budget, genre }) {
  const cityValue = String(city || '').trim();
  const genreValue = String(genre || '').trim();
  const moodValue = String(mood || '').trim();
  const limit = budgetLimit(budget);

  const scored = fallbackPlans.map((plan) => {
    let score = 0;
    if (!cityValue || plan.cities.some((item) => item.toLowerCase() === cityValue.toLowerCase())) score += 2;
    if (!genreValue || plan.genres.some((item) => item.toLowerCase() === genreValue.toLowerCase())) score += 2;
    if (!moodValue || plan.moods.some((item) => item.toLowerCase() === moodValue.toLowerCase())) score += 2;
    if (plan.estimatedPrice <= limit) score += 2;
    return { ...plan, score };
  });

  return scored
    .sort((a, b) => b.score - a.score || b.rating - a.rating)
    .slice(0, 5)
    .map(({ genres, moods, cities, score, ...plan }) => plan);
}

function parseAiJson(text) {
  const cleanText = String(text || '')
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  return JSON.parse(cleanText);
}

// POST /api/ai/recommend
router.post('/recommend', async (req, res) => {
  const { mood, city, budget, genre, groupType } = req.body;

  try {
    if (!genAI) {
      return res.json(buildFallbackRecommendations({ mood, city, budget, genre }));
    }

    const prompt = `You are Eventora's AI concierge. Based on mood: ${mood || 'any'}, city: ${city || 'Mumbai'}, budget: ${budget || 'any'}, genre preference: ${genre || 'any'}, group type: ${groupType || 'solo'} — suggest 5 perfect entertainment options for tonight in India. Return ONLY a valid JSON array with no markdown, no explanation. Format: [{ "title": "string", "type": "movie/concert/comedy/sports/restaurant", "reason": "string", "venue": "string", "estimatedPrice": number, "rating": number, "emoji": "string" }]`;

    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const recommendations = parseAiJson(response.text());

    res.json(recommendations);
  } catch (err) {
    console.error('AI recommend error:', err.message);
    res.json(buildFallbackRecommendations({ mood, city, budget, genre }));
  }
});

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    if (!genAI) {
      return res.json({
        reply: 'I can still help with local picks. Try Discover for movies, or choose a movie and I will take you to available showtimes.',
      });
    }

    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' });

    const chatHistory = (history || []).map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'You are Eventora\'s AI concierge, an expert in movies, showtimes, food plans, and nightlife in India. Be helpful, fun, and concise.' }],
        },
        {
          role: 'model',
          parts: [{ text: 'Hey! I\'m your Eventora AI concierge 🎬✨ I can help with movies, showtimes, food plans, comedy nights, and nightlife across India. What are you in the mood for tonight?' }],
        },
        ...chatHistory,
      ],
    });

    const result = await chat.sendMessage(message);
    const response = result.response;

    res.json({ reply: response.text() });
  } catch (err) {
    console.error('AI chat error:', err.message);
    res.json({
      reply: 'AI chat is temporarily offline, but the movie and booking flows are still ready.',
    });
  }
});

module.exports = router;
