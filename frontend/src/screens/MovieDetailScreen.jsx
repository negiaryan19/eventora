import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE, TMDB_IMAGE, TMDB_IMAGE_ORIGINAL } from '../constants';
import { useAuth } from '../context/AuthContext';
import MovieCard from '../components/MovieCard';
import Loader from '../components/Loader';
import '../styles/MovieDetail.css';

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

function getInitials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';
}

function CastAvatar({ person }) {
  const [imageFailed, setImageFailed] = useState(false);
  const profileUrl = person.profile_path ? `${TMDB_IMAGE}${person.profile_path}` : '';

  if (profileUrl && !imageFailed) {
    return (
      <img
        src={profileUrl}
        alt={person.name}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return <div className="cast-avatar-fallback">{getInitials(person.name)}</div>;
}

function MovieDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();

  const [movie, setMovie] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [backdropFailed, setBackdropFailed] = useState(false);

  useEffect(() => {
    setShowTrailer(false);
    setPosterFailed(false);
    setBackdropFailed(false);
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
  const poster = movie.poster_path ? `${TMDB_IMAGE}${movie.poster_path}` : '';
  const hasBackdrop = backdrop && !backdropFailed;
  const hasPoster = poster && !posterFailed;
  const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
  const trailerSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.trailerSearchQuery || `${movie.title} official trailer`)}`;
  const fallbackGenre = GENRE_LABELS[movie.genre_ids?.[0]] || movie.genres?.[0]?.name || movie.language || 'Movie';

  return (
    <div className="movie-detail" id="movie-detail">
      <div className={`movie-backdrop ${hasBackdrop ? '' : 'movie-backdrop-fallback'}`}>
        {hasBackdrop ? (
          <img
            src={backdrop}
            alt={movie.title}
            onError={() => setBackdropFailed(true)}
          />
        ) : (
          <div className="movie-backdrop-fallback-content">
            <span>{fallbackGenre}</span>
            <strong>{movie.title}</strong>
            <small>{year}</small>
          </div>
        )}
        <div className="movie-backdrop-gradient" />
      </div>

      <div className="movie-detail-content">
        <div className="movie-detail-top">
          <div className={`movie-detail-poster ${hasPoster ? '' : 'movie-detail-poster-fallback'}`}>
            {hasPoster ? (
              <img
                src={poster}
                alt={movie.title}
                onError={() => setPosterFailed(true)}
              />
            ) : (
              <div className="detail-poster-fallback">
                <span>{fallbackGenre}</span>
                <strong>{movie.title}</strong>
                <small>{year}</small>
              </div>
            )}
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
              {!movie.trailerKey && (
                <a className="trailer-btn" href={trailerSearchUrl} target="_blank" rel="noreferrer" id="trailer-search-link">
                  Find Trailer
                </a>
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
                    <CastAvatar person={person} />
                  </div>
                  <p className="cast-name">{person.name}</p>
                  <p className="cast-character" title={person.character}>{person.character}</p>
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
