const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  venue: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['concert', 'comedy', 'sports', 'festival', 'nightlife'],
    required: true,
  },
  image: {
    type: String,
    default: '',
  },
  date: {
    type: Date,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  ticketmasterId: {
    type: String,
    default: '',
  },
  coordinates: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Event', eventSchema);
