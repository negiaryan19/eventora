const express = require('express');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const Booking = require('../models/Booking');
const User = require('../models/User');
const razorpay = require('../utils/razorpay');
const { sendBookingConfirmation } = require('../utils/email');

const router = express.Router();

// POST /api/booking/create-order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { movieId, movieTitle, moviePoster, seats, showtime, totalAmount } = req.body;

    if (!movieId || !movieTitle || !seats || !showtime || !totalAmount) {
      return res.status(400).json({ error: 'Missing required booking fields.' });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: totalAmount * 100, // Convert to paise
      currency: 'INR',
      receipt: 'booking_' + Date.now(),
    });

    // Save pending booking
    const booking = new Booking({
      userId: req.user.id,
      movieId,
      movieTitle,
      moviePoster: moviePoster || '',
      seats,
      showtime,
      totalAmount,
      razorpayOrderId: order.id,
      status: 'pending',
    });

    await booking.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      bookingDbId: booking._id,
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create booking order.' });
  }
});

// POST /api/booking/verify-payment
router.post('/verify-payment', auth, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingDbId } = req.body;

    // Verify HMAC signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpayOrderId + '|' + razorpayPaymentId)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ success: false, error: 'Payment verification failed.' });
    }

    // Update booking to confirmed
    const booking = await Booking.findById(bookingDbId);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found.' });
    }

    booking.status = 'confirmed';
    booking.razorpayPaymentId = razorpayPaymentId;
    await booking.save();

    // Send confirmation email
    const user = await User.findById(req.user.id);
    if (user) {
      sendBookingConfirmation(user.email, booking).catch(() => {});
    }

    res.json({ success: true, bookingId: booking._id });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ success: false, error: 'Payment verification failed.' });
  }
});

// GET /api/booking/my-bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({
      userId: req.user.id,
      status: 'confirmed',
    }).sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error('My bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
});

// GET /api/booking/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access to this booking.' });
    }

    res.json(booking);
  } catch (err) {
    console.error('Get booking error:', err);
    res.status(500).json({ error: 'Failed to fetch booking.' });
  }
});

module.exports = router;
