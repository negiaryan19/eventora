import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE, TMDB_IMAGE } from '../constants';
import Loader from '../components/Loader';
import '../styles/Tickets.css';

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function TicketVerifyScreen() {
  const { ticketCode } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCancelled = false;

    const fetchTicket = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await axios.get(`${API_BASE}/booking/public/${ticketCode}`);
        if (!isCancelled) {
          setTicket(data);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.response?.data?.error || 'Ticket could not be verified.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchTicket();

    return () => {
      isCancelled = true;
    };
  }, [ticketCode]);

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="ticket-verify-screen">
        <div className="ticket-verify-card">
          <span className="verify-status invalid">Invalid</span>
          <h1>Ticket Not Found</h1>
          <p>{error}</p>
          <Link to="/">Go Home</Link>
        </div>
      </div>
    );
  }

  const isConfirmed = ticket?.status === 'confirmed';

  return (
    <div className="ticket-verify-screen">
      <div className="ticket-verify-card">
        <span className={`verify-status ${isConfirmed ? 'valid' : 'invalid'}`}>
          {isConfirmed ? 'Valid Ticket' : 'Not Confirmed'}
        </span>
        <div className="verify-ticket-main">
          {ticket.moviePoster && (
            <img
              src={`${TMDB_IMAGE}${ticket.moviePoster}`}
              alt={ticket.movieTitle}
              className="verify-poster"
            />
          )}
          <div>
            <h1>{ticket.movieTitle}</h1>
            <p>{ticket.venue || 'Eventora Cinemas'}</p>
            <p>{formatDate(ticket.showDate || ticket.createdAt)} • {ticket.showtime}</p>
          </div>
        </div>
        <div className="verify-detail-grid">
          <div>
            <span>Booking ID</span>
            <strong>{ticket.bookingCode}</strong>
          </div>
          <div>
            <span>Ticket ID</span>
            <strong>{ticket.ticketCode}</strong>
          </div>
          <div>
            <span>Person</span>
            <strong>{ticket.attendeeName || 'Guest'}</strong>
          </div>
          <div>
            <span>Seats</span>
            <strong>{ticket.seats?.join(', ')}</strong>
          </div>
        </div>
        <Link to="/" className="verify-home-link">Back to Eventora</Link>
      </div>
    </div>
  );
}

export default TicketVerifyScreen;
