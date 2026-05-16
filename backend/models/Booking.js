const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  movieId: {
    type: String,
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
  bookingCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  ticketCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  seats: {
    type: [String],
    required: true,
  },
  showtime: {
    type: String,
    required: true,
  },
  showDate: {
    type: Date,
    default: Date.now,
  },
  venue: {
    type: String,
    default: 'Eventora Cinemas',
  },
  screen: {
    type: String,
    default: 'Screen 1',
  },
  city: {
    type: String,
    default: 'Bengaluru',
  },
  format: {
    type: String,
    default: '2D',
  },
  language: {
    type: String,
    default: 'English',
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['created', 'attempted', 'paid', 'manual_verified', 'failed'],
    default: 'created',
  },
  paymentProvider: {
    type: String,
    enum: ['razorpay', 'manual_upi', 'legacy', ''],
    default: '',
  },
  paymentReference: {
    type: String,
    default: '',
  },
  paymentQrCodeUrl: {
    type: String,
    default: '',
  },
  paymentQrData: {
    type: String,
    default: '',
  },
  razorpayOrderId: {
    type: String,
    default: '',
  },
  razorpayPaymentId: {
    type: String,
    default: '',
  },
  razorpaySignature: {
    type: String,
    default: '',
  },
  qrCodeUrl: {
    type: String,
    default: '',
  },
  qrShortlinkUrl: {
    type: String,
    default: '',
  },
  qrProviderId: {
    type: String,
    default: '',
  },
  qrPurpose: {
    type: String,
    default: '',
  },
  qrData: {
    type: String,
    default: '',
  },
  attendeeName: {
    type: String,
    default: '',
  },
  attendeeEmail: {
    type: String,
    default: '',
  },
  confirmedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Booking', bookingSchema);
