import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE, TMDB_IMAGE } from '../constants';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import '../styles/Tickets.css';

function TicketsScreen() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

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

      {bookings.length === 0 ? (
        <div className="tickets-empty">
          <h3>🎟️ No tickets yet</h3>
          <p>Discover something amazing and book your first experience</p>
          <Link to="/discover">Explore Movies →</Link>
        </div>
      ) : (
        <div className="tickets-list">
          {bookings.map((booking) => (
            <div className="ticket-card" key={booking._id} id={`ticket-${booking._id}`}>
              <div className="ticket-poster">
                <img
                  src={booking.moviePoster ? `${TMDB_IMAGE}${booking.moviePoster}` : 'https://via.placeholder.com/140x210?text=Poster'}
                  alt={booking.movieTitle}
                />
              </div>
              <div className="ticket-info">
                <h3 className="ticket-title">{booking.movieTitle}</h3>
                <p className="ticket-detail">🕐 {booking.showtime}</p>
                <p className="ticket-detail">
                  📅 {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
                <div className="ticket-seats">
                  {booking.seats.map((s) => (
                    <span className="seat-badge" key={s}>{s}</span>
                  ))}
                </div>
                <div className="ticket-footer">
                  <span className="ticket-amount">₹{booking.totalAmount}</span>
                  <span className="status-badge confirmed">✓ CONFIRMED</span>
                </div>
              </div>
              <div className="ticket-qr">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${booking._id}`}
                  alt="QR Code"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TicketsScreen;
