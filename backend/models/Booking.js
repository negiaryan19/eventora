const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  movieId: {
    type: Number,
    required: true,
  },
  movieTitle: {
    type: String,
    required: true,
  },
  moviePoster: {
    type: String,
    default: '',
  },
  seats: {
    type: [String],
    required: true,
  },
  showtime: {
    type: String,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  razorpayOrderId: {
    type: String,
    default: '',
  },
  razorpayPaymentId: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Booking', bookingSchema);
