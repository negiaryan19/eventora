function EventCard({ event }) {
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
      </div>
    </div>
  );
}

export default EventCard;
