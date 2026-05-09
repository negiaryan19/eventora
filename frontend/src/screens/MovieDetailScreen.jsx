import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE, TMDB_IMAGE, TMDB_IMAGE_ORIGINAL } from '../constants';
import { useAuth } from '../context/AuthContext';
import MovieCard from '../components/MovieCard';
import Loader from '../components/Loader';
import '../styles/MovieDetail.css';

function MovieDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();

  const [movie, setMovie] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    fetchMovie();
    fetchSimilar();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchMovie = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/movies/${id}`);
      setMovie(data);
    } catch (err) {
      console.error('Movie fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilar = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/movies/${id}/similar`);
      setSimilar(data.results || []);
    } catch (err) {
      console.error('Similar fetch error:', err);
    }
  };

  const handleBook = () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    navigate(`/book/${id}`, {
      state: {
        movieTitle: movie.title,
        moviePoster: movie.poster_path,
        movieId: movie.id,
      },
    });
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) { navigate('/auth'); return; }
    try {
      const { data } = await axios.post(
        `${API_BASE}/favorites/toggle`,
        { movieId: movie.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsFav(data.favorites.includes(movie.id));
    } catch (err) {
      console.error('Fav error:', err);
    }
  };

  if (loading) return <Loader />;
  if (!movie) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--muted)' }}>Movie not found</div>;

  const backdrop = movie.backdrop_path ? `${TMDB_IMAGE_ORIGINAL}${movie.backdrop_path}` : '';
  const poster = movie.poster_path ? `${TMDB_IMAGE}${movie.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Poster';
  const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

  return (
    <div className="movie-detail" id="movie-detail">
      {backdrop && (
        <div className="movie-backdrop">
          <img src={backdrop} alt={movie.title} />
          <div className="movie-backdrop-gradient" />
        </div>
      )}

      <div className="movie-detail-content">
        <div className="movie-detail-top">
          <div className="movie-detail-poster">
            <img src={poster} alt={movie.title} />
          </div>
          <div className="movie-detail-info">
            <h1 className="movie-detail-title">{movie.title}</h1>
            {movie.tagline && <p className="movie-detail-tagline">"{movie.tagline}"</p>}

            <div className="movie-meta">
              <span className="movie-meta-item">
                <span className="star-rating">★ {rating}</span>
              </span>
              <span className="movie-meta-item">📅 {year}</span>
              {runtime && <span className="movie-meta-item">⏱ {runtime}</span>}
            </div>

            {movie.genres && (
              <div className="movie-genres">
                {movie.genres.map((g) => (
                  <span className="genre-tag" key={g.id}>{g.name}</span>
                ))}
              </div>
            )}

            {movie.overview && <p className="movie-overview">{movie.overview}</p>}

            <div className="movie-actions">
              <button className="book-btn" onClick={handleBook} id="book-now-btn">
                🎟️ BOOK NOW
              </button>
              {movie.trailerKey && (
                <button className="trailer-btn" onClick={() => setShowTrailer(true)} id="trailer-btn">
                  ▶ Watch Trailer
                </button>
              )}
              <button className="fav-detail-btn" onClick={handleFavorite} id="fav-detail-btn">
                {isFav ? '❤️' : '🤍'}
              </button>
            </div>
          </div>
        </div>

        {/* Cast */}
        {movie.cast && movie.cast.length > 0 && (
          <div className="movie-cast-section">
            <h2 className="section-title">🎭 CAST</h2>
            <div className="cast-row">
              {movie.cast.map((person) => (
                <div className="cast-member" key={person.id}>
                  <div className="cast-avatar">
                    <img
                      src={person.profile_path ? `${TMDB_IMAGE}${person.profile_path}` : 'https://via.placeholder.com/72?text=?'}
                      alt={person.name}
                    />
                  </div>
                  <p className="cast-name">{person.name}</p>
                  <p className="cast-character">{person.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <div className="similar-section">
          <h2 className="section-title">🎬 SIMILAR MOVIES</h2>
          <div className="scroll-row">
            {similar.slice(0, 12).map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
        </div>
      )}

      {/* Trailer Modal */}
      {showTrailer && movie.trailerKey && (
        <div className="trailer-modal" onClick={() => setShowTrailer(false)}>
          <button className="trailer-modal-close" onClick={() => setShowTrailer(false)}>✕</button>
          <div className="trailer-iframe-container" onClick={(e) => e.stopPropagation()}>
            <iframe
              src={`https://www.youtube.com/embed/${movie.trailerKey}?autoplay=1`}
              title="Trailer"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default MovieDetailScreen;
