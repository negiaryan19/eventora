import { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE, TMDB_IMAGE, RAZORPAY_SCRIPT } from '../constants';
import { useAuth } from '../context/AuthContext';
import '../styles/SeatSelection.css';

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const SEATS_PER_ROW = 10;
const BOOKED_SEATS = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10'];
const SHOWTIMES = ['10:00 AM', '1:30 PM', '5:00 PM', '9:00 PM'];

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

function SeatSelectionScreen() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const movieTitle = location.state?.movieTitle || 'Movie';
  const moviePoster = location.state?.moviePoster || '';
  const movieId = location.state?.movieId || parseInt(id);

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showtime, setShowtime] = useState(SHOWTIMES[0]);
  const [step, setStep] = useState(1);
  const [payLoading, setPayLoading] = useState(false);
  const [error, setError] = useState('');

  const totalAmount = selectedSeats.reduce((sum, seatId) => {
    const row = seatId.charAt(0);
    return sum + getSeatPrice(row);
  }, 0);

  const toggleSeat = (seatId) => {
    if (BOOKED_SEATS.includes(seatId)) return;
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((s) => s !== seatId);
      }
      if (prev.length >= 8) return prev;
      return [...prev, seatId];
    });
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.querySelector(`script[src="${RAZORPAY_SCRIPT}"]`)) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = RAZORPAY_SCRIPT;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setPayLoading(true);
    setError('');
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { setError('Failed to load payment gateway.'); setPayLoading(false); return; }

      const { data: orderData } = await axios.post(
        `${API_BASE}/booking/create-order`,
        { movieId, movieTitle, moviePoster, seats: selectedSeats, showtime, totalAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Eventora',
        description: `${movieTitle} — ${selectedSeats.join(', ')}`,
        order_id: orderData.orderId,
        prefill: { name: user?.name || '', email: user?.email || '' },
        theme: { color: '#7c5cfc' },
        handler: async function (response) {
          try {
            await axios.post(
              `${API_BASE}/booking/verify-payment`,
              {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                bookingDbId: orderData.bookingDbId,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            navigate('/tickets');
          } catch (err) {
            setError('Payment verification failed.');
          }
        },
        modal: { ondismiss: () => setPayLoading(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="seat-screen" id="seat-screen">
      <div className="seat-screen-header">
        <h1>{movieTitle}</h1>
        <p>Select your seats and showtime</p>
      </div>

      <div className="step-indicator">
        <div className={`step-dot ${step >= 1 ? 'active' : ''}`} />
        <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
      </div>

      {step === 1 && (
        <>
          <div className="screen-display">
            <div className="screen-curve" />
            <span className="screen-label">Screen</span>
          </div>

          <div className="seat-grid">
            {ROWS.map((row) => (
              <div className="seat-row" key={row}>
                <span className="row-label">{row}</span>
                {Array.from({ length: SEATS_PER_ROW }, (_, i) => {
                  const seatId = `${row}${i + 1}`;
                  const isBooked = BOOKED_SEATS.includes(seatId);
                  const isSelected = selectedSeats.includes(seatId);
                  return (
                    <button
                      key={seatId}
                      className={`seat ${isBooked ? 'booked' : isSelected ? 'selected' : 'available'}`}
                      onClick={() => toggleSeat(seatId)}
                      disabled={isBooked}
                      title={`${seatId} — ₹${getSeatPrice(row)} (${getTierLabel(row)})`}
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
            <div className="tier-badge">Rows A–C: <span>₹250</span> (Premium)</div>
            <div className="tier-badge">Rows D–F: <span>₹200</span> (Executive)</div>
            <div className="tier-badge">Rows G–H: <span>₹150</span> (Classic)</div>
          </div>

          <div className="showtime-section">
            <h3>Select Showtime</h3>
            <div className="showtime-options">
              {SHOWTIMES.map((t) => (
                <button
                  key={t}
                  className={`showtime-btn ${showtime === t ? 'active' : ''}`}
                  onClick={() => setShowtime(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {selectedSeats.length > 0 && (
            <div className="booking-summary">
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
                PROCEED TO PAY →
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
              <p>🎫 Seats: {selectedSeats.join(', ')}</p>
              <p>🕐 Showtime: {showtime}</p>
            </div>
          </div>

          <div className="booking-summary">
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

          {error && <p style={{ color: 'var(--danger)', marginTop: 16 }}>{error}</p>}

          <button
            className="pay-btn"
            onClick={handlePayment}
            disabled={payLoading}
            id="pay-btn"
          >
            {payLoading ? 'Processing...' : `Pay ₹${totalAmount} with Razorpay`}
          </button>
          <br />
          <button className="back-btn" onClick={() => setStep(1)}>← Back to Seats</button>
        </div>
      )}
    </div>
  );
}

export default SeatSelectionScreen;
