const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/ai/recommend
router.post('/recommend', async (req, res) => {
  try {
    const { mood, city, budget, genre, groupType } = req.body;

    const prompt = `You are Eventora's AI concierge. Based on mood: ${mood || 'any'}, city: ${city || 'Mumbai'}, budget: ${budget || 'any'}, genre preference: ${genre || 'any'}, group type: ${groupType || 'solo'} — suggest 5 perfect entertainment options for tonight in India. Return ONLY a valid JSON array with no markdown, no explanation. Format: [{ "title": "string", "type": "movie/concert/comedy/sports/restaurant", "reason": "string", "venue": "string", "estimatedPrice": number, "rating": number, "emoji": "string" }]`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Clean up any markdown formatting
    let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let recommendations;
    try {
      recommendations = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error('AI JSON parse error:', parseErr.message, 'Raw:', cleanText);
      return res.status(500).json({ error: 'AI returned invalid format. Please try again.' });
    }

    res.json(recommendations);
  } catch (err) {
    console.error('AI recommend error:', err.message);
    res.status(500).json({ error: 'AI recommendation failed: ' + err.message });
  }
});

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const chatHistory = (history || []).map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'You are Eventora\'s AI concierge, an expert in movies, events, nightlife, and entertainment in India. Be helpful, fun, and concise.' }],
        },
        {
          role: 'model',
          parts: [{ text: 'Hey! I\'m your Eventora AI concierge 🎬✨ I know everything about movies, events, concerts, comedy shows, and nightlife across India. What are you in the mood for tonight?' }],
        },
        ...chatHistory,
      ],
    });

    const result = await chat.sendMessage(message);
    const response = result.response;

    res.json({ reply: response.text() });
  } catch (err) {
    console.error('AI chat error:', err.message);
    res.status(500).json({ error: 'AI chat failed: ' + err.message });
  }
});

module.exports = router;
