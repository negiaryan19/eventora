import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import { TMDB_IMAGE, API_BASE } from '../constants';
import { useAuth } from '../context/AuthContext';

function MovieCard({ movie }) {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const [isFav, setIsFav] = useState(false);

  const posterUrl = movie.poster_path
    ? `${TMDB_IMAGE}${movie.poster_path}`
    : 'https://via.placeholder.com/300x450?text=No+Poster';

  const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

  const handleClick = () => {
    navigate(`/movie/${movie.id}`);
  };

  const handleFavorite = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    try {
      const { data } = await axios.post(
        `${API_BASE}/favorites/toggle`,
        { movieId: movie.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsFav(data.favorites.includes(movie.id));
    } catch (err) {
      console.error('Favorite toggle error:', err);
    }
  };

  return (
    <div className="movie-card" onClick={handleClick} id={`movie-card-${movie.id}`}>
      <div className="movie-card-poster">
        <img src={posterUrl} alt={movie.title} loading="lazy" />
        <div className="movie-card-overlay">
          <button
            className={`fav-btn ${isFav ? 'active' : ''}`}
            onClick={handleFavorite}
            aria-label="Toggle favorite"
          >
            {isFav ? '❤️' : '🤍'}
          </button>
          <div className="movie-card-rating">
            <span className="star">★</span> {rating}
          </div>
        </div>
      </div>
      <div className="movie-card-info">
        <h3 className="movie-card-title">{movie.title}</h3>
        <span className="movie-card-year">{year}</span>
      </div>
    </div>
  );
}

export default MovieCard;
