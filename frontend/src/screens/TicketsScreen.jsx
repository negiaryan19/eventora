import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE, TMDB_IMAGE } from '../constants';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import '../styles/Tickets.css';

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function TicketsScreen() {
  const location = useLocation();
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const paymentComplete = Boolean(location.state?.paymentComplete);
  const activeBookingId = location.state?.bookingId;

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/booking/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(data);
    } catch (err) {
      console.error('Bookings fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="tickets-screen" id="tickets-screen">
      <div className="tickets-header">
        <h1>MY TICKETS</h1>
        <p>{bookings.length} confirmed booking{bookings.length !== 1 ? 's' : ''}</p>
      </div>

      {paymentComplete && (
        <div className="payment-complete-banner">
          Payment verified. Your ticket QR is ready.
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="tickets-empty">
          <h3>No tickets yet</h3>
          <p>Discover something amazing and book your first experience</p>
          <Link to="/discover">Explore Movies</Link>
        </div>
      ) : (
        <div className="tickets-list">
          {bookings.map((booking) => (
            <div
              className={`ticket-card ${activeBookingId === booking._id ? 'active-ticket' : ''}`}
              key={booking._id}
              id={`ticket-${booking._id}`}
            >
              <div className="ticket-poster">
                <img
                  src={booking.moviePoster ? `${TMDB_IMAGE}${booking.moviePoster}` : 'https://via.placeholder.com/140x210?text=Poster'}
                  alt={booking.movieTitle}
                />
              </div>
              <div className="ticket-info">
                <div>
                  <span className="ticket-id-label">Booking ID</span>
                  <strong className="ticket-booking-code">{booking.bookingCode || booking._id}</strong>
                </div>
                <h3 className="ticket-title">{booking.movieTitle}</h3>
                <p className="ticket-detail">{booking.venue || 'Eventora Cinemas'}</p>
                <p className="ticket-detail">
                  {formatDate(booking.showDate || booking.createdAt)} • {booking.showtime} • {booking.language || 'English'} • {booking.format || '2D'}
                </p>
                <p className="ticket-detail">Ticket ID: {booking.ticketCode || booking._id}</p>
                <div className="ticket-seats">
                  {booking.seats.map((s) => (
                    <span className="seat-badge" key={s}>{s}</span>
                  ))}
                </div>
                <div className="ticket-payment-row">
                  <span>{booking.paymentProvider === 'razorpay' ? 'Razorpay' : 'UPI'} paid</span>
                  {booking.paymentReference && <strong>{booking.paymentReference}</strong>}
                </div>
                <div className="ticket-footer">
                  <span className="ticket-amount">₹{booking.totalAmount}</span>
                  <span className="status-badge confirmed">CONFIRMED</span>
                </div>
              </div>
              <div className="ticket-qr">
                {booking.qrCodeUrl ? (
                  <>
                    <img src={booking.qrCodeUrl} alt={`Ticket QR code for ${booking.movieTitle}`} />
                    <span>Scan ticket</span>
                    {booking.ticketVerificationUrl && (
                      <a href={booking.ticketVerificationUrl} target="_blank" rel="noreferrer">
                        Verify
                      </a>
                    )}
                  </>
                ) : (
                  <div className="ticket-qr-placeholder">QR pending</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TicketsScreen;
