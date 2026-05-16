import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import { TMDB_IMAGE, API_BASE } from '../constants';
import { useAuth } from '../context/AuthContext';

const GENRE_LABELS = {
  12: 'Adventure',
  14: 'Fantasy',
  16: 'Animation',
  18: 'Drama',
  27: 'Horror',
  28: 'Action',
  35: 'Comedy',
  36: 'History',
  53: 'Thriller',
  80: 'Crime',
  878: 'Sci-Fi',
  9648: 'Mystery',
  10749: 'Romance',
};

function MovieCard({ movie }) {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const [isFav, setIsFav] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
  const posterUrl = movie.poster_path ? `${TMDB_IMAGE}${movie.poster_path}` : '';
  const hasPoster = posterUrl && !imageFailed;
  const primaryGenre = GENRE_LABELS[movie.genre_ids?.[0]] || movie.language || 'Movie';

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
      <div className={`movie-card-poster ${hasPoster ? '' : 'movie-card-poster-fallback'}`}>
        {hasPoster ? (
          <img
            src={posterUrl}
            alt={movie.title}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="movie-poster-fallback" aria-label={`${movie.title} poster placeholder`}>
            <span>{primaryGenre}</span>
            <strong>{movie.title}</strong>
            <small>{year}</small>
          </div>
        )}
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
