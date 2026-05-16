import { useEffect, useMemo, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE, TMDB_IMAGE } from '../constants';
import { useAuth } from '../context/AuthContext';
import '../styles/SeatSelection.css';

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const SEATS_PER_ROW = 10;
const HOUSE_BLOCKED_SEATS = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10'];
const SHOW_DATE = new Date().toISOString();
const FALLBACK_VENUES = [
  {
    name: 'PVR: Orion Mall, Dr Rajkumar Road',
    city: 'Bengaluru',
    screen: 'Audi 4',
    format: 'ATMOS',
    language: 'Tamil - 2D',
    showtimes: ['07:25 PM', '10:30 PM'],
  },
  {
    name: 'INOX: Megaplex Mall of Asia Bangalore',
    city: 'Bengaluru',
    screen: 'Insignia',
    format: 'Laser',
    language: 'Tamil - 2D',
    showtimes: ['07:15 PM', '09:30 PM', '10:20 PM'],
  },
  {
    name: 'Cinepolis: Nexus Shantiniketan',
    city: 'Bengaluru',
    screen: 'Screen 3',
    format: 'Dolby 7.1',
    language: 'Tamil - 2D',
    showtimes: ['07:20 PM', '10:30 PM'],
  },
];

function getSeatPrice(row) {
  if (['A', 'B', 'C'].includes(row)) return 250;
  if (['D', 'E', 'F'].includes(row)) return 200;
  return 150;
}

function getTierLabel(row) {
  if (['A', 'B', 'C'].includes(row)) return 'Premium';
  if (['D', 'E', 'F'].includes(row)) return 'Executive';
  return 'Classic';
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function loadRazorpayScript() {
  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function SeatSelectionScreen() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const routeMovieId = parseInt(id, 10);
  const stateMovieTitle = location.state?.movieTitle || '';
  const stateMoviePoster = location.state?.moviePoster || '';
  const stateMovieId = location.state?.movieId || routeMovieId;
  const [resolvedMovie, setResolvedMovie] = useState({
    title: stateMovieTitle,
    poster: stateMoviePoster,
    id: stateMovieId,
  });
  const movieTitle = resolvedMovie.title || 'Movie';
  const moviePoster = resolvedMovie.poster || '';
  const movieId = resolvedMovie.id || routeMovieId;

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [venues, setVenues] = useState(FALLBACK_VENUES);
  const [venueIndex, setVenueIndex] = useState(0);
  const selectedVenue = venues[venueIndex] || venues[0] || FALLBACK_VENUES[0];
  const [showtime, setShowtime] = useState(FALLBACK_VENUES[0].showtimes[0]);
  const [showtimeStatus, setShowtimeStatus] = useState({
    loading: true,
    live: false,
    source: 'demo_fallback',
    message: 'Checking showtimes...',
  });
  const [bookedSeats, setBookedSeats] = useState([]);
  const [step, setStep] = useState(1);
  const [payLoading, setPayLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkout, setCheckout] = useState(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [error, setError] = useState('');

  const unavailableSeats = useMemo(
    () => [...new Set([...HOUSE_BLOCKED_SEATS, ...bookedSeats])],
    [bookedSeats]
  );

  const totalAmount = selectedSeats.reduce((sum, seatId) => {
    const row = seatId.charAt(0);
    return sum + getSeatPrice(row);
  }, 0);

  useEffect(() => {
    let isCancelled = false;

    if (stateMovieTitle) {
      setResolvedMovie({
        title: stateMovieTitle,
        poster: stateMoviePoster,
        id: stateMovieId,
      });
      return () => {
        isCancelled = true;
      };
    }

    const fetchMovieDetails = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/movies/${routeMovieId}`);

        if (!isCancelled) {
          setResolvedMovie({
            title: data.title || '',
            poster: data.poster_path || '',
            id: data.id || routeMovieId,
          });
        }
      } catch (err) {
        if (!isCancelled) {
          setResolvedMovie((prev) => ({
            ...prev,
            id: routeMovieId,
          }));
        }
      }
    };

    fetchMovieDetails();

    return () => {
      isCancelled = true;
    };
  }, [routeMovieId, stateMovieTitle, stateMoviePoster, stateMovieId]);

  useEffect(() => {
    let isCancelled = false;

    const fetchShowtimes = async () => {
      setShowtimeStatus((prev) => ({
        ...prev,
        loading: true,
        message: 'Checking showtimes...',
      }));

      try {
        const { data } = await axios.get(`${API_BASE}/showtimes`, {
          params: {
            movieId,
            movieTitle,
            city: 'Bengaluru',
          },
        });

        if (isCancelled) return;

        const nextVenues = Array.isArray(data.venues) && data.venues.length
          ? data.venues
          : FALLBACK_VENUES;

        setVenues(nextVenues);
        setVenueIndex(0);
        setShowtime(nextVenues[0]?.showtimes?.[0] || '');
        setShowtimeStatus({
          loading: false,
          live: Boolean(data.live),
          source: data.source || 'demo_fallback',
          provider: data.provider,
          message: data.message || (data.live ? 'Live showtimes loaded.' : 'Demo showtimes shown.'),
        });
      } catch (err) {
        if (isCancelled) return;

        setVenues(FALLBACK_VENUES);
        setVenueIndex(0);
        setShowtime(FALLBACK_VENUES[0].showtimes[0]);
        setShowtimeStatus({
          loading: false,
          live: false,
          source: 'demo_fallback',
          message: 'Showtime service is unavailable, so demo showtimes are shown.',
        });
      }
    };

    fetchShowtimes();

    return () => {
      isCancelled = true;
    };
  }, [movieId, movieTitle]);

  useEffect(() => {
    setShowtime(selectedVenue.showtimes?.[0] || '');
    setSelectedSeats([]);
    setCheckout(null);
    setError('');
  }, [venueIndex, selectedVenue]);

  useEffect(() => {
    let isCancelled = false;

    const fetchBookedSeats = async () => {
      if (!showtime || !selectedVenue?.name) {
        setBookedSeats([]);
        return;
      }

      try {
        const { data } = await axios.get(`${API_BASE}/booking/booked-seats`, {
          params: {
            movieId,
            showtime,
            venue: selectedVenue.name,
            excludeBookingId: checkout?.booking?._id,
          },
        });

        if (!isCancelled) {
          setBookedSeats(data.seats || []);
        }
      } catch (err) {
        if (!isCancelled) {
          setBookedSeats([]);
        }
      }
    };

    fetchBookedSeats();

    return () => {
      isCancelled = true;
    };
  }, [movieId, showtime, selectedVenue.name, checkout?.booking?._id]);

  useEffect(() => {
    setSelectedSeats((prev) => prev.filter((seat) => !unavailableSeats.includes(seat)));
  }, [unavailableSeats]);

  useEffect(() => {
    if (step !== 2 || !selectedSeats.length) return;
    if (!showtime || !selectedVenue?.name) {
      setError('Please select a valid showtime.');
      return;
    }

    let isCancelled = false;

    const createCheckout = async () => {
      const checkoutSeats = checkout?.booking?.seats || [];
      const seatsMatch = checkoutSeats.length === selectedSeats.length
        && selectedSeats.every((seat) => checkoutSeats.includes(seat));

      if (
        checkout?.booking?._id
        && seatsMatch
        && checkout.booking.showtime === showtime
        && checkout.booking.venue === selectedVenue.name
      ) {
        return;
      }

      setCheckoutLoading(true);
      setCheckout(null);
      setPaymentReference('');
      setError('');

      try {
        const { data } = await axios.post(
          `${API_BASE}/booking/create-payment`,
          {
            movieId,
            movieTitle,
            moviePoster,
            seats: selectedSeats,
            showtime,
            showDate: SHOW_DATE,
            venue: selectedVenue.name,
            screen: selectedVenue.screen,
            city: selectedVenue.city,
            format: selectedVenue.format,
            language: selectedVenue.language,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!isCancelled) {
          setCheckout(data);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.response?.data?.error || 'Payment could not be started.');
        }
      } finally {
        if (!isCancelled) {
          setCheckoutLoading(false);
        }
      }
    };

    createCheckout();

    return () => {
      isCancelled = true;
    };
  }, [step, selectedSeats, movieId, movieTitle, moviePoster, showtime, selectedVenue, token]);

  const toggleSeat = (seatId) => {
    if (unavailableSeats.includes(seatId)) return;

    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((s) => s !== seatId);
      }
      if (prev.length >= 8) return prev;
      return [...prev, seatId];
    });
    setCheckout(null);
  };

  const handleRazorpayPayment = async () => {
    if (!checkout?.razorpay || !checkout?.booking?._id) {
      setError('Payment session is not ready yet.');
      return;
    }

    setPayLoading(true);
    setError('');

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setPayLoading(false);
      setError('Razorpay checkout could not be loaded.');
      return;
    }

    const options = {
      key: checkout.razorpay.key,
      amount: checkout.razorpay.amount,
      currency: checkout.razorpay.currency,
      name: checkout.razorpay.name,
      description: checkout.razorpay.description,
      order_id: checkout.razorpay.orderId,
      prefill: {
        name: user?.name || checkout.razorpay.prefill?.name || '',
        email: user?.email || checkout.razorpay.prefill?.email || '',
      },
      notes: {
        booking_id: checkout.booking.bookingCode,
      },
      theme: {
        color: '#7c5cfc',
      },
      modal: {
        ondismiss: () => {
          setPayLoading(false);
        },
      },
      handler: async (response) => {
        try {
          const { data } = await axios.post(
            `${API_BASE}/booking/verify-payment`,
            {
              bookingId: checkout.booking._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          navigate('/tickets', {
            replace: true,
            state: { paymentComplete: true, bookingId: data.booking?._id },
          });
        } catch (err) {
          setError(err.response?.data?.error || 'Payment verification failed.');
          setPayLoading(false);
        }
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', (response) => {
      setError(response.error?.description || 'Payment failed. Please try again.');
      setPayLoading(false);
    });
    razorpay.open();
  };

  const handleManualUpiConfirmation = async () => {
    if (!checkout?.booking?._id) {
      setError('Payment session is not ready yet.');
      return;
    }

    setPayLoading(true);
    setError('');
    try {
      const { data } = await axios.post(
        `${API_BASE}/booking/confirm-upi`,
        {
          bookingId: checkout.booking._id,
          paymentReference,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate('/tickets', {
        replace: true,
        state: { paymentComplete: true, bookingId: data.booking?._id },
      });
    } catch (err) {
      setError(err.response?.data?.error || 'UPI payment could not be confirmed.');
    } finally {
      setPayLoading(false);
    }
  };

  const activeBooking = checkout?.booking;

  return (
    <div className="seat-screen" id="seat-screen">
      <div className="seat-screen-header">
        <h1>{movieTitle}</h1>
        <p>Select your show, seats and payment</p>
      </div>

      <div className="step-indicator">
        <div className={`step-dot ${step >= 1 ? 'active' : ''}`} />
        <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
      </div>

      {step === 1 && (
        <>
          <div className="show-date-strip">
            <div className="show-date-card active">
              <span>Today</span>
              <strong>{formatDate(SHOW_DATE)}</strong>
            </div>
            <div className="show-date-meta">
              <span className="availability-dot" />
              Available
              <span className="availability-dot fast" />
              Fast filling
            </div>
          </div>

          <div className={`showtime-source-note ${showtimeStatus.live ? 'live' : 'demo'}`}>
            <span className="source-dot" />
            {showtimeStatus.loading
              ? 'Checking cinema availability...'
              : showtimeStatus.live
                ? `Live showtimes from ${showtimeStatus.provider || 'provider'}`
                : showtimeStatus.message}
          </div>

          <div className="venue-list">
            {venues.map((venue, index) => (
              <button
                key={venue.name}
                className={`venue-card ${venueIndex === index ? 'active' : ''}`}
                onClick={() => setVenueIndex(index)}
              >
                <span className="venue-logo">{venue.name.split(':')[0]}</span>
                <span>
                  <strong>{venue.name}</strong>
                  <small>{venue.city} • {venue.format} • {venue.language || '2D'}</small>
                </span>
              </button>
            ))}
          </div>

          <div className="showtime-section">
            <h3>Select Showtime</h3>
            <div className="showtime-options">
              {(selectedVenue.showtimes || []).map((t) => (
                <button
                  key={t}
                  className={`showtime-btn ${showtime === t ? 'active' : ''}`}
                  onClick={() => {
                    setShowtime(t);
                    setSelectedSeats([]);
                    setCheckout(null);
                  }}
                >
                  <strong>{t}</strong>
                  <span>{selectedVenue.format}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="screen-display">
            <div className="screen-curve" />
            <span className="screen-label">{selectedVenue.screen}</span>
          </div>

          <div className="seat-grid">
            {ROWS.map((row) => (
              <div className="seat-row" key={row}>
                <span className="row-label">{row}</span>
                {Array.from({ length: SEATS_PER_ROW }, (_, i) => {
                  const seatId = `${row}${i + 1}`;
                  const isBooked = unavailableSeats.includes(seatId);
                  const isSelected = selectedSeats.includes(seatId);
                  return (
                    <button
                      key={seatId}
                      className={`seat ${isBooked ? 'booked' : isSelected ? 'selected' : 'available'}`}
                      onClick={() => toggleSeat(seatId)}
                      disabled={isBooked}
                      title={`${seatId} - ₹${getSeatPrice(row)} (${getTierLabel(row)})`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
                <span className="row-label">{row}</span>
              </div>
            ))}
          </div>

          <div className="seat-legend">
            <div className="legend-item"><div className="legend-dot available" /> Available</div>
            <div className="legend-item"><div className="legend-dot selected" /> Selected</div>
            <div className="legend-item"><div className="legend-dot booked" /> Booked</div>
          </div>

          <div className="tier-info">
            <div className="tier-badge">Rows A-C: <span>₹250</span> Premium</div>
            <div className="tier-badge">Rows D-F: <span>₹200</span> Executive</div>
            <div className="tier-badge">Rows G-H: <span>₹150</span> Classic</div>
          </div>

          {selectedSeats.length > 0 && (
            <div className="booking-summary">
              <div className="summary-row">
                <span className="summary-label">Venue</span>
                <span className="summary-value">{selectedVenue.name}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Seats</span>
                <span className="summary-value">{selectedSeats.join(', ')}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Showtime</span>
                <span className="summary-value">{showtime}</span>
              </div>
              <div className="summary-row total">
                <span className="summary-label">Total</span>
                <span className="summary-value total-amount">₹{totalAmount}</span>
              </div>
              <button className="proceed-btn" onClick={() => setStep(2)} id="proceed-btn">
                PROCEED TO PAY
              </button>
            </div>
          )}
        </>
      )}

      {step === 2 && (
        <div className="payment-review">
          <h2>PAYMENT REVIEW</h2>
          <div className="payment-movie-info">
            {moviePoster && (
              <div className="payment-poster">
                <img src={`${TMDB_IMAGE}${moviePoster}`} alt={movieTitle} />
              </div>
            )}
            <div className="payment-details">
              <h3>{movieTitle}</h3>
              <p>{selectedVenue.name}</p>
              <p>{formatDate(SHOW_DATE)} • {showtime} • {selectedVenue.language}</p>
            </div>
          </div>

          <div className="real-booking-panel">
            <div>
              <span>Booking ID</span>
              <strong>{activeBooking?.bookingCode || 'Creating...'}</strong>
            </div>
            <div>
              <span>Person</span>
              <strong>{activeBooking?.attendeeName || user?.name || 'Guest'}</strong>
            </div>
            <div>
              <span>Ticket ID</span>
              <strong>{activeBooking?.ticketCode || 'After payment'}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{activeBooking?.status || 'pending'}</strong>
            </div>
          </div>

          <div className="booking-summary payment-summary">
            <div className="summary-row">
              <span className="summary-label">Tickets ({selectedSeats.length})</span>
              <span className="summary-value">₹{totalAmount}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Convenience Fee</span>
              <span className="summary-value">₹0</span>
            </div>
            <div className="summary-row total">
              <span className="summary-label">Total</span>
              <span className="summary-value total-amount">₹{totalAmount}</span>
            </div>
          </div>

          {checkoutLoading && <div className="payment-qr-loading">Creating secure payment...</div>}

          {!checkoutLoading && checkout?.mode === 'razorpay' && (
            <div className="payment-gateway-panel">
              <span className="payment-gateway-badge">Razorpay</span>
              <div>
                <h3>UPI, cards and netbanking</h3>
                <p>Payment is verified on the backend before your ticket QR is issued.</p>
              </div>
            </div>
          )}

          {!checkoutLoading && checkout?.mode === 'manual_upi' && (
            <div className="payment-qr-panel">
              {checkout.manualUpi?.qrCodeUrl ? (
                <>
                  <img src={checkout.manualUpi.qrCodeUrl} alt={`UPI payment QR code for ${movieTitle}`} />
                  <div>
                    <h3>Scan to pay ₹{totalAmount}</h3>
                    <p>{checkout.manualUpi.payee}</p>
                  </div>
                </>
              ) : (
                <div className="payment-qr-loading">UPI QR unavailable</div>
              )}
            </div>
          )}

          {checkout?.mode === 'manual_upi' && (
            <label className="upi-reference-field">
              <span>UPI transaction ID / UTR</span>
              <input
                type="text"
                value={paymentReference}
                onChange={(event) => setPaymentReference(event.target.value)}
                placeholder="Example: 412345678901"
              />
            </label>
          )}

          {error && <p className="payment-error">{error}</p>}

          {checkout?.mode === 'manual_upi' ? (
            <button
              className="pay-btn"
              onClick={handleManualUpiConfirmation}
              disabled={payLoading || checkoutLoading || !paymentReference.trim()}
              id="pay-btn"
            >
              {payLoading ? 'Creating ticket...' : 'CONFIRM UPI PAYMENT'}
            </button>
          ) : (
            <button
              className="pay-btn"
              onClick={handleRazorpayPayment}
              disabled={payLoading || checkoutLoading || !checkout}
              id="pay-btn"
            >
              {payLoading ? 'Waiting for payment...' : `PAY ₹${totalAmount}`}
            </button>
          )}
          <br />
          <button className="back-btn" onClick={() => setStep(1)}>Back to Seats</button>
        </div>
      )}
    </div>
  );
}

export default SeatSelectionScreen;
