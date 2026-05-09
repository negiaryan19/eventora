import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../constants';
import MovieCard from '../components/MovieCard';
import Loader from '../components/Loader';
import '../styles/DiscoverScreen.css';

const GENRES = [
  { id: 0, name: 'All' },
  { id: 28, name: 'Action' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 53, name: 'Thriller' },
  { id: 27, name: 'Horror' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
];

const SORT_OPTIONS = [
  { value: 'trending', label: 'Trending', endpoint: '/movies/trending' },
  { value: 'toprated', label: 'Top Rated', endpoint: '/movies/toprated' },
  { value: 'upcoming', label: 'Upcoming', endpoint: '/movies/upcoming' },
  { value: 'nowplaying', label: 'Now Playing', endpoint: '/movies/nowplaying' },
];

function DiscoverScreen() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState(0);
  const [sortBy, setSortBy] = useState('trending');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      searchMovies(q);
    } else {
      fetchBySort(sortBy);
    }
  }, [searchParams]);

  const fetchBySort = async (sort) => {
    setLoading(true);
    try {
      const opt = SORT_OPTIONS.find((s) => s.value === sort);
      const { data } = await axios.get(`${API_BASE}${opt.endpoint}`);
      setMovies(data.results || []);
    } catch (err) {
      console.error('Fetch movies error:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchMovies = async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/movies/search?q=${encodeURIComponent(q)}`);
      setMovies(data.results || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      searchMovies(query);
    }
  };

  const handleSortChange = (e) => {
    const val = e.target.value;
    setSortBy(val);
    setQuery('');
    fetchBySort(val);
  };

  const handleGenreFilter = (genreId) => {
    setActiveGenre(genreId);
  };

  const filteredMovies = activeGenre === 0
    ? movies
    : movies.filter((m) => m.genre_ids && m.genre_ids.includes(activeGenre));

  return (
    <div className="discover-screen" id="discover-screen">
      <div className="discover-header">
        <h1>DISCOVER</h1>
        <p>Find your next favorite movie</p>
      </div>

      <form className="discover-search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search for movies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          id="discover-search-input"
        />
        <button type="submit" id="discover-search-btn">Search</button>
      </form>

      <div className="discover-filters">
        <div className="genre-pills">
          {GENRES.map((g) => (
            <button
              key={g.id}
              className={`genre-pill ${activeGenre === g.id ? 'active' : ''}`}
              onClick={() => handleGenreFilter(g.id)}
            >
              {g.name}
            </button>
          ))}
        </div>
        <select className="sort-select" value={sortBy} onChange={handleSortChange} id="sort-select">
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="skeleton-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div className="skeleton-card" key={i}>
              <div className="skeleton-poster" />
              <div className="skeleton-info">
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredMovies.length > 0 ? (
        <div className="discover-grid">
          {filteredMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="discover-empty">
          <h3>No movies found</h3>
          <p>Try a different search or genre filter</p>
        </div>
      )}
    </div>
  );
}

export default DiscoverScreen;
