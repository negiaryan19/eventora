import { useState } from 'react';
import axios from 'axios';
import { API_BASE, RAZORPAY_SCRIPT } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function EventCard({ event }) {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [payLoading, setPayLoading] = useState(false);

  const dateStr = event.date
    ? new Date(event.date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'TBA';

  const categoryColors = {
    concert: '#7c5cfc',
    comedy: '#f5c518',
    sports: '#22c55e',
    festival: '#ef4444',
    nightlife: '#a78bfa',
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.querySelector(`script[src="${RAZORPAY_SCRIPT}"]`)) {
        resolve(true); return;
      }
      const script = document.createElement('script');
      script.src = RAZORPAY_SCRIPT;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBookEvent = async () => {
    if (!token) {
      alert('Please log in to book events!');
      navigate('/auth');
      return;
    }
    setPayLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { alert('Failed to load payment gateway.'); setPayLoading(false); return; }

      const { data: orderData } = await axios.post(
        `${API_BASE}/booking/create-order`,
        { 
          eventId: event._id, 
          eventTitle: event.title, 
          totalAmount: event.price,
          seats: ['General Admission'],
          showtime: dateStr 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Eventora',
        description: `Booking for ${event.title}`,
        order_id: orderData.orderId,
        prefill: { name: user?.name || '', email: user?.email || '' },
        theme: { color: categoryColors[event.category] || '#7c5cfc' },
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
            alert('Event booked successfully!');
            navigate('/tickets');
          } catch (err) {
            alert('Payment verification failed.');
          }
        },
        modal: { ondismiss: () => setPayLoading(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert('Payment failed. Please try again.');
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="event-card" id={`event-card-${event._id}`}>
      <div className="event-card-image">
        <img src={event.image} alt={event.title} loading="lazy" />
        <span
          className="event-card-category"
          style={{ background: categoryColors[event.category] || '#7c5cfc' }}
        >
          {event.category}
        </span>
      </div>
      <div className="event-card-body">
        <h3 className="event-card-title">{event.title}</h3>
        <p className="event-card-venue">📍 {event.venue}, {event.city}</p>
        <div className="event-card-footer">
          <span className="event-card-date">📅 {dateStr}</span>
          <span className="event-card-price">₹{event.price}</span>
        </div>
        <button 
          onClick={handleBookEvent} 
          disabled={payLoading}
          style={{
            marginTop: '15px',
            width: '100%',
            padding: '10px',
            background: categoryColors[event.category] || '#7c5cfc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: payLoading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {payLoading ? 'Processing...' : 'Book Event with Razorpay'}
        </button>
      </div>
    </div>
  );
}

export default EventCard;
