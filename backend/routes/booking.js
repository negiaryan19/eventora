const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { sendBookingConfirmation } = require('../utils/email');
const {
  createDynamicQrCode,
  getHovercodeConfig,
  getHovercodeErrorMessage,
  getQrImageUrl,
} = require('../utils/hovercode');
const {
  createRazorpayOrder,
  getRazorpayConfig,
  getRazorpayErrorMessage,
  verifyRazorpaySignature,
} = require('../utils/razorpay');

const router = express.Router();
const PENDING_HOLD_MINUTES = 15;

function getPublicAppUrl() {
  return (process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

function generateCode(prefix) {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${stamp}-${random}`;
}

function getSeatPrice(seatId) {
  const row = String(seatId || '').charAt(0).toUpperCase();
  if (['A', 'B', 'C'].includes(row)) return 250;
  if (['D', 'E', 'F'].includes(row)) return 200;
  return 150;
}

function calculateTotal(seats = []) {
  return seats.reduce((sum, seatId) => sum + getSeatPrice(seatId), 0);
}

function normaliseSeats(seats) {
  if (!Array.isArray(seats)) return [];

  return [...new Set(
    seats
      .map((seat) => String(seat || '').trim().toUpperCase())
      .filter(Boolean)
  )];
}

function buildHostedQrImageUrl(data, size = 260) {
  const encodedData = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=12&data=${encodedData}`;
}

function buildUpiPaymentUrl({ amount, note }) {
  const basePaymentUrl = process.env.UPI_PAYMENT_URL || process.env.PAYMENT_QR_URL;

  if (basePaymentUrl) {
    const paymentUrl = new URL(basePaymentUrl);
    paymentUrl.searchParams.set('am', Number(amount).toFixed(2));
    paymentUrl.searchParams.set('cu', 'INR');
    paymentUrl.searchParams.set('tn', note);
    return paymentUrl.toString();
  }

  if (process.env.UPI_ID) {
    const paymentUrl = new URL('upi://pay');
    paymentUrl.searchParams.set('pa', process.env.UPI_ID);
    paymentUrl.searchParams.set('pn', process.env.UPI_PAYEE_NAME || 'Eventora');
    paymentUrl.searchParams.set('am', Number(amount).toFixed(2));
    paymentUrl.searchParams.set('cu', 'INR');
    paymentUrl.searchParams.set('tn', note);
    return paymentUrl.toString();
  }

  return '';
}

function buildTicketVerificationUrl(booking) {
  return `${getPublicAppUrl()}/ticket/${booking.ticketCode || booking._id}`;
}

async function createTicketQrImage({ targetUrl, displayName }) {
  const hovercodeConfig = getHovercodeConfig();

  if (hovercodeConfig.isConfigured) {
    try {
      const hovercode = await createDynamicQrCode({
        targetUrl,
        displayName,
        generatePng: true,
      });

      const qrCodeUrl = getQrImageUrl(hovercode);
      if (qrCodeUrl) {
        return {
          qrCodeUrl,
          qrShortlinkUrl: hovercode.shortlink_url || '',
          qrProviderId: hovercode.id || '',
        };
      }
    } catch (err) {
      console.error('Hovercode ticket QR generation failed:', getHovercodeErrorMessage(err));
    }
  }

  return {
    qrCodeUrl: buildHostedQrImageUrl(targetUrl),
    qrShortlinkUrl: '',
    qrProviderId: '',
  };
}

async function ensureTicketCode(booking) {
  let changed = false;

  if (!booking.bookingCode) {
    booking.bookingCode = generateCode('EVT');
    changed = true;
  }

  if (!booking.ticketCode) {
    booking.ticketCode = generateCode('TKT');
    changed = true;
  }

  if (changed) {
    await booking.save();
  }

  return booking;
}

async function addTicketQrToBooking(booking) {
  await ensureTicketCode(booking);

  if (booking.qrCodeUrl && booking.qrPurpose === 'ticket') {
    return booking;
  }

  const targetUrl = buildTicketVerificationUrl(booking);
  const qr = await createTicketQrImage({
    targetUrl,
    displayName: `Ticket ${booking.bookingCode}`,
  });

  booking.qrCodeUrl = qr.qrCodeUrl;
  booking.qrShortlinkUrl = qr.qrShortlinkUrl;
  booking.qrProviderId = qr.qrProviderId;
  booking.qrPurpose = 'ticket';
  booking.qrData = targetUrl;
  await booking.save();

  return booking;
}

function publicBooking(booking) {
  return {
    _id: booking._id,
    bookingCode: booking.bookingCode,
    ticketCode: booking.ticketCode,
    movieId: booking.movieId,
    movieTitle: booking.movieTitle,
    moviePoster: booking.moviePoster,
    seats: booking.seats,
    showtime: booking.showtime,
    showDate: booking.showDate,
    venue: booking.venue,
    screen: booking.screen,
    city: booking.city,
    format: booking.format,
    language: booking.language,
    totalAmount: booking.totalAmount,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    paymentProvider: booking.paymentProvider,
    paymentReference: booking.paymentReference,
    razorpayOrderId: booking.razorpayOrderId,
    razorpayPaymentId: booking.razorpayPaymentId,
    qrCodeUrl: booking.qrCodeUrl,
    qrShortlinkUrl: booking.qrShortlinkUrl,
    qrPurpose: booking.qrPurpose,
    qrData: booking.qrData,
    ticketVerificationUrl: buildTicketVerificationUrl(booking),
    attendeeName: booking.attendeeName,
    attendeeEmail: booking.attendeeEmail,
    createdAt: booking.createdAt,
    confirmedAt: booking.confirmedAt,
  };
}

async function sendConfirmationEmailForBooking(booking, userId) {
  const user = await User.findById(userId);
  if (user) {
    const sent = await sendBookingConfirmation(user.email, booking);
    if (!sent) {
      console.warn(`Booking confirmed but email was not delivered for ${booking.bookingCode || booking._id}`);
    }
  }
}

async function findSeatConflict({ movieId, showtime, venue, seats, excludeBookingId }) {
  const holdCutoff = new Date(Date.now() - PENDING_HOLD_MINUTES * 60 * 1000);
  const query = {
    movieId: String(movieId),
    showtime,
    seats: { $in: seats },
    $or: [
      { status: 'confirmed' },
      { status: 'pending', createdAt: { $gte: holdCutoff } },
    ],
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  if (venue) {
    query.venue = venue;
  }

  return Booking.findOne(query);
}

async function createPendingBooking(req, res, provider) {
  const {
    movieId,
    movieTitle,
    moviePoster,
    eventId,
    eventTitle,
    seats,
    showtime,
    showDate,
    venue,
    screen,
    city,
    format,
    language,
  } = req.body;

  const title = movieTitle || eventTitle;
  const id = movieId || eventId;
  const selectedSeats = normaliseSeats(seats);

  if (!id || !title || selectedSeats.length === 0 || !showtime) {
    res.status(400).json({ error: 'Movie, showtime and at least one seat are required.' });
    return null;
  }

  if (selectedSeats.length > 8) {
    res.status(400).json({ error: 'You can book up to 8 seats at once.' });
    return null;
  }

  const conflict = await findSeatConflict({
    movieId: id,
    showtime,
    venue: venue || 'Eventora Cinemas',
    seats: selectedSeats,
  });

  if (conflict) {
    res.status(409).json({ error: 'One or more selected seats were just booked. Please choose different seats.' });
    return null;
  }

  const user = await User.findById(req.user.id);
  const totalAmount = calculateTotal(selectedSeats);

  const booking = new Booking({
    userId: req.user.id,
    movieId: String(id),
    movieTitle: title,
    moviePoster: moviePoster || '',
    seats: selectedSeats,
    showtime,
    showDate: showDate ? new Date(showDate) : new Date(),
    venue: venue || 'Eventora Cinemas',
    screen: screen || 'Screen 1',
    city: city || user?.preferences?.city || 'Bengaluru',
    format: format || '2D',
    language: language || 'English',
    totalAmount,
    status: 'pending',
    paymentStatus: 'created',
    paymentProvider: provider,
    bookingCode: generateCode('EVT'),
    ticketCode: generateCode('TKT'),
    attendeeName: user?.name || req.user.email || 'Guest',
    attendeeEmail: user?.email || req.user.email || '',
  });

  await booking.save();
  return booking;
}

// GET /api/booking/booked-seats?movieId=123&showtime=10:00%20AM
router.get('/booked-seats', async (req, res) => {
  try {
    const { movieId, showtime, venue, excludeBookingId } = req.query;

    if (!movieId || !showtime) {
      return res.status(400).json({ error: 'movieId and showtime are required.' });
    }

    const holdCutoff = new Date(Date.now() - PENDING_HOLD_MINUTES * 60 * 1000);
    const query = {
      movieId: String(movieId),
      showtime,
      ...(venue ? { venue } : {}),
      $or: [
        { status: 'confirmed' },
        { status: 'pending', createdAt: { $gte: holdCutoff } },
      ],
    };

    if (excludeBookingId && mongoose.Types.ObjectId.isValid(excludeBookingId)) {
      query._id = { $ne: excludeBookingId };
    }

    const bookings = await Booking.find(query).select('seats');

    res.json({
      seats: [...new Set(bookings.flatMap((booking) => booking.seats))],
    });
  } catch (err) {
    console.error('Booked seats error:', err);
    res.status(500).json({ error: 'Failed to fetch booked seats.' });
  }
});

// POST /api/booking/create-payment
router.post('/create-payment', auth, async (req, res) => {
  try {
    const razorpayConfig = getRazorpayConfig();
    const provider = razorpayConfig.isConfigured ? 'razorpay' : 'manual_upi';
    const booking = await createPendingBooking(req, res, provider);

    if (!booking) return;

    if (razorpayConfig.isConfigured) {
      try {
        const order = await createRazorpayOrder({
          amount: booking.totalAmount,
          currency: 'INR',
          receipt: booking.bookingCode.slice(0, 40),
          notes: {
            bookingId: String(booking._id),
            bookingCode: booking.bookingCode,
            movieTitle: booking.movieTitle,
          },
        });

        booking.razorpayOrderId = order.id;
        booking.paymentStatus = order.status || 'created';
        await booking.save();

        return res.json({
          mode: 'razorpay',
          booking: publicBooking(booking),
          razorpay: {
            key: razorpayConfig.keyId,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            name: 'Eventora',
            description: `${booking.movieTitle} tickets`,
            prefill: {
              name: booking.attendeeName,
              email: booking.attendeeEmail,
            },
          },
        });
      } catch (razorpayErr) {
        booking.status = 'failed';
        booking.paymentStatus = 'failed';
        await booking.save();
        console.error('Razorpay order error:', getRazorpayErrorMessage(razorpayErr));
        return res.status(502).json({ error: 'Payment order could not be created.' });
      }
    }

    const paymentUrl = buildUpiPaymentUrl({
      amount: booking.totalAmount,
      note: `Eventora ${booking.bookingCode}`,
    });

    if (!paymentUrl) {
      booking.status = 'failed';
      booking.paymentStatus = 'failed';
      await booking.save();
      return res.status(503).json({
        error: 'Payment is not configured. Add Razorpay keys or UPI_ID in backend/.env.',
      });
    }

    booking.paymentQrCodeUrl = buildHostedQrImageUrl(paymentUrl);
    booking.paymentQrData = paymentUrl;
    booking.paymentReference = booking.bookingCode;
    await booking.save();

    return res.json({
      mode: 'manual_upi',
      booking: publicBooking(booking),
      manualUpi: {
        qrCodeUrl: booking.paymentQrCodeUrl,
        qrData: booking.paymentQrData,
        payee: process.env.UPI_PAYEE_NAME || 'Eventora',
      },
    });
  } catch (err) {
    console.error('Create payment error:', err);
    res.status(500).json({ error: 'Failed to start booking payment.' });
  }
});

// POST /api/booking/verify-payment
router.post('/verify-payment', auth, async (req, res) => {
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification details are required.' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access to this booking.' });
    }

    if (booking.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ error: 'Payment order mismatch.' });
    }

    const conflict = await findSeatConflict({
      movieId: booking.movieId,
      showtime: booking.showtime,
      venue: booking.venue,
      seats: booking.seats,
      excludeBookingId: booking._id,
    });

    if (conflict) {
      booking.status = 'failed';
      booking.paymentStatus = 'failed';
      await booking.save();
      return res.status(409).json({ error: 'These seats are no longer available.' });
    }

    const isValid = verifyRazorpaySignature({
      orderId: booking.razorpayOrderId,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      booking.status = 'failed';
      booking.paymentStatus = 'failed';
      await booking.save();
      return res.status(400).json({ error: 'Payment signature verification failed.' });
    }

    booking.status = 'confirmed';
    booking.paymentStatus = 'paid';
    booking.paymentProvider = 'razorpay';
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.razorpaySignature = razorpay_signature;
    booking.paymentReference = razorpay_payment_id;
    booking.confirmedAt = new Date();
    await booking.save();

    await addTicketQrToBooking(booking);
    await sendConfirmationEmailForBooking(booking, req.user.id);

    res.json({
      success: true,
      booking: publicBooking(booking),
    });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ error: 'Failed to verify payment.' });
  }
});

// POST /api/booking/confirm-upi
router.post('/confirm-upi', auth, async (req, res) => {
  try {
    const { bookingId, paymentReference } = req.body;

    if (!bookingId || !paymentReference || String(paymentReference).trim().length < 6) {
      return res.status(400).json({ error: 'Enter a valid UPI transaction reference.' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access to this booking.' });
    }

    const conflict = await findSeatConflict({
      movieId: booking.movieId,
      showtime: booking.showtime,
      venue: booking.venue,
      seats: booking.seats,
      excludeBookingId: booking._id,
    });

    if (conflict) {
      booking.status = 'failed';
      booking.paymentStatus = 'failed';
      await booking.save();
      return res.status(409).json({ error: 'These seats are no longer available.' });
    }

    booking.status = 'confirmed';
    booking.paymentStatus = 'manual_verified';
    booking.paymentProvider = 'manual_upi';
    booking.paymentReference = String(paymentReference).trim();
    booking.confirmedAt = new Date();
    await booking.save();

    await addTicketQrToBooking(booking);
    await sendConfirmationEmailForBooking(booking, req.user.id);

    res.json({
      success: true,
      booking: publicBooking(booking),
    });
  } catch (err) {
    console.error('Confirm UPI error:', err);
    res.status(500).json({ error: 'Failed to confirm UPI payment.' });
  }
});

// POST /api/booking/payment-qr
router.post('/payment-qr', auth, async (req, res) => {
  try {
    const { totalAmount } = req.body;

    if (!totalAmount) {
      return res.status(400).json({ error: 'totalAmount is required.' });
    }

    const paymentReference = `preview-${req.user.id}-${Date.now()}`;
    const paymentUrl = buildUpiPaymentUrl({
      amount: totalAmount,
      note: `Eventora ${paymentReference}`,
    });

    if (!paymentUrl) {
      return res.status(503).json({ error: 'UPI payment QR is not configured.' });
    }

    res.json({
      qrCodeUrl: buildHostedQrImageUrl(paymentUrl),
      qrShortlinkUrl: '',
      qrProviderId: '',
      qrPurpose: 'payment',
      qrData: paymentUrl,
    });
  } catch (err) {
    console.error('Payment QR generation error:', err);
    res.status(502).json({ error: 'Payment QR code could not be generated.' });
  }
});

// POST /api/booking/book
router.post('/book', auth, async (req, res) => {
  try {
    const booking = await createPendingBooking(req, res, 'manual_upi');
    const { paymentReference } = req.body;

    if (!booking) return;

    booking.status = 'confirmed';
    booking.paymentStatus = paymentReference ? 'manual_verified' : 'paid';
    booking.paymentReference = paymentReference || `legacy-${booking.bookingCode}`;
    booking.confirmedAt = new Date();
    await booking.save();

    await addTicketQrToBooking(booking);
    await sendConfirmationEmailForBooking(booking, req.user.id);

    res.json({
      success: true,
      bookingId: booking._id,
      booking: publicBooking(booking),
      qrCode: booking.qrCodeUrl,
      qrShortlink: booking.qrShortlinkUrl,
    });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Failed to complete booking.' });
  }
});

// GET /api/booking/my-bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({
      userId: req.user.id,
      status: 'confirmed',
    }).sort({ createdAt: -1 });

    const hydratedBookings = await Promise.all(
      bookings.map(async (booking) => addTicketQrToBooking(booking))
    );

    res.json(hydratedBookings.map(publicBooking));
  } catch (err) {
    console.error('My bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
});

// GET /api/booking/public/:ticketCode
router.get('/public/:ticketCode', async (req, res) => {
  try {
    const { ticketCode } = req.params;
    const lookup = [
      { ticketCode },
      { bookingCode: ticketCode },
    ];

    if (mongoose.Types.ObjectId.isValid(ticketCode)) {
      lookup.push({ _id: ticketCode });
    }

    const booking = await Booking.findOne({ $or: lookup });
    if (!booking) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    if (booking.status === 'confirmed') {
      await addTicketQrToBooking(booking);
    } else {
      await ensureTicketCode(booking);
    }

    res.json(publicBooking(booking));
  } catch (err) {
    console.error('Public ticket error:', err);
    res.status(500).json({ error: 'Failed to fetch ticket.' });
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

    if (booking.status === 'confirmed') {
      await addTicketQrToBooking(booking);
    } else {
      await ensureTicketCode(booking);
    }

    res.json(publicBooking(booking));
  } catch (err) {
    console.error('Get booking error:', err);
    res.status(500).json({ error: 'Failed to fetch booking.' });
  }
});

module.exports = router;
