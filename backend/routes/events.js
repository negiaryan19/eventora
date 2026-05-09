const express = require('express');
const Event = require('../models/Event');

const router = express.Router();

// GET /api/events
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.city) filter.city = new RegExp(req.query.city, 'i');
    if (req.query.category) filter.category = req.query.category;

    const events = await Event.find(filter).sort({ date: 1 });
    res.json(events);
  } catch (err) {
    console.error('Events fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch events.' });
  }
});

// POST /api/events/seed
router.post('/seed', async (req, res) => {
  try {
    await Event.deleteMany({});

    const sampleEvents = [
      {
        title: 'Arijit Singh Live — Soulful Nights',
        description: 'An unforgettable evening of soulful melodies by Arijit Singh. Experience the magic of live music under the stars.',
        venue: 'MMRDA Grounds',
        city: 'Mumbai',
        category: 'concert',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
        date: new Date('2026-06-15'),
        price: 2500,
        ticketmasterId: 'tm_001',
        coordinates: { lat: 19.0596, lng: 72.8295 },
      },
      {
        title: 'Zakir Khan — Haq Se Single 4.0',
        description: 'India\'s favorite comedian is back with an all-new hour of hilarious stand-up comedy.',
        venue: 'Siri Fort Auditorium',
        city: 'Delhi',
        category: 'comedy',
        image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800',
        date: new Date('2026-06-20'),
        price: 999,
        ticketmasterId: 'tm_002',
        coordinates: { lat: 28.5680, lng: 77.2220 },
      },
      {
        title: 'IPL Fan Park — RCB vs MI',
        description: 'Watch the biggest IPL rivalry on giant screens with fellow fans, food stalls, and cricket activities.',
        venue: 'Chinnaswamy Stadium Fan Zone',
        city: 'Bangalore',
        category: 'sports',
        image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800',
        date: new Date('2026-05-25'),
        price: 500,
        ticketmasterId: 'tm_003',
        coordinates: { lat: 12.9788, lng: 77.5996 },
      },
      {
        title: 'Sunburn Arena ft. Martin Garrix',
        description: 'The ultimate EDM experience with international DJ Martin Garrix. Lasers, bass drops, and pure energy.',
        venue: 'Hitex Exhibition Center',
        city: 'Hyderabad',
        category: 'concert',
        image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
        date: new Date('2026-07-04'),
        price: 3500,
        ticketmasterId: 'tm_004',
        coordinates: { lat: 17.4483, lng: 78.3826 },
      },
      {
        title: 'Madras Comedy Night',
        description: 'A lineup of Tamil Nadu\'s funniest standup comedians performing in English and Tamil.',
        venue: 'The Music Academy',
        city: 'Chennai',
        category: 'comedy',
        image: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800',
        date: new Date('2026-06-10'),
        price: 750,
        ticketmasterId: 'tm_005',
        coordinates: { lat: 13.0418, lng: 80.2468 },
      },
      {
        title: 'Holi Music Festival 2026',
        description: 'Dance to Bollywood beats, splash colors, and celebrate the festival of joy with thousands of revelers.',
        venue: 'Juhu Beach Grounds',
        city: 'Mumbai',
        category: 'festival',
        image: 'https://images.unsplash.com/photo-1576016770956-debb63d92058?w=800',
        date: new Date('2026-03-14'),
        price: 1200,
        ticketmasterId: 'tm_006',
        coordinates: { lat: 19.0948, lng: 72.8267 },
      },
      {
        title: 'Neon Nights — Rooftop Party',
        description: 'An exclusive rooftop nightlife experience with craft cocktails, DJ sets, and panoramic city views.',
        venue: 'The Sky Lounge, UB City',
        city: 'Bangalore',
        category: 'nightlife',
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
        date: new Date('2026-06-28'),
        price: 1800,
        ticketmasterId: 'tm_007',
        coordinates: { lat: 12.9716, lng: 77.5946 },
      },
      {
        title: 'India vs Australia — T20 World Cup Screening',
        description: 'Giant screen live screening of the T20 World Cup clash. Cheer for India with beer, biryani, and banter.',
        venue: 'Gachibowli Stadium Grounds',
        city: 'Hyderabad',
        category: 'sports',
        image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800',
        date: new Date('2026-06-05'),
        price: 400,
        ticketmasterId: 'tm_008',
        coordinates: { lat: 17.4156, lng: 78.3483 },
      },
      {
        title: 'Delhi Food & Music Festival',
        description: 'Three days of gourmet street food, live indie music, and artisanal craft markets in the heart of Delhi.',
        venue: 'Nehru Park',
        city: 'Delhi',
        category: 'festival',
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
        date: new Date('2026-07-12'),
        price: 600,
        ticketmasterId: 'tm_009',
        coordinates: { lat: 28.5877, lng: 77.1950 },
      },
      {
        title: 'Midnight Masquerade — NYE Preview',
        description: 'An exclusive masquerade-themed nightlife event with live jazz, champagne, and mystery.',
        venue: 'ITC Grand Chola Ballroom',
        city: 'Chennai',
        category: 'nightlife',
        image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
        date: new Date('2026-12-31'),
        price: 4000,
        ticketmasterId: 'tm_010',
        coordinates: { lat: 13.0108, lng: 80.2150 },
      },
    ];

    await Event.insertMany(sampleEvents);
    res.json({ message: 'Successfully seeded 10 events.', count: sampleEvents.length });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ error: 'Failed to seed events.' });
  }
});

module.exports = router;
