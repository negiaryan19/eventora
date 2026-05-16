import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../constants';
import MovieCard from '../components/MovieCard';
import Loader from '../components/Loader';
import '../styles/HomeScreen.css';

const AI_FALLBACK_RESULTS = [
  {
    title: 'Premium multiplex night',
    type: 'movie',
    reason: 'Comfortable seats, clean sound, and an easy plan when the live AI service is not available.',
    venue: 'PVR / INOX near you',
    estimatedPrice: 450,
    rating: 4.5,
    emoji: '🍿',
  },
  {
    title: 'Dhurandhar',
    type: 'movie',
    reason: 'A high-energy action thriller pick for an evening show.',
    venue: 'PVR: Orion Mall, Bengaluru',
    estimatedPrice: 250,
    rating: 7.1,
    emoji: '🎬',
  },
  {
    title: 'Karuppu',
    type: 'movie',
    reason: 'A big-screen fantasy-action option with a theatrical feel.',
    venue: 'INOX: Megaplex Mall of Asia Bangalore',
    estimatedPrice: 250,
    rating: 7.4,
    emoji: '🎟️',
  },
];

function HomeScreen() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [trending, setTrending] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [isFallbackUpcoming, setIsFallbackUpcoming] = useState(false);
  const [loadingMovies, setLoadingMovies] = useState(true);

  // AI state
  const [aiMood, setAiMood] = useState('');
  const [aiCity, setAiCity] = useState('');
  const [aiBudget, setAiBudget] = useState('');
  const [aiGenre, setAiGenre] = useState('');
  const [aiResults, setAiResults] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoadingMovies(true);
      const [trendRes, npRes, upRes] = await Promise.all([
        axios.get(`${API_BASE}/movies/trending`),
        axios.get(`${API_BASE}/movies/nowplaying`),
        axios.get(`${API_BASE}/movies/upcoming`),
      ]);
      setTrending(trendRes.data.results || []);
      setNowPlaying(npRes.data.results || []);
      setUpcoming(upRes.data.results || []);
      setIsFallbackUpcoming(upRes.data.source === 'fallback');
    } catch (err) {
      console.error('Failed to fetch movies:', err);
    } finally {
      setLoadingMovies(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleAiAsk = async () => {
    if (!aiMood && !aiCity && !aiBudget && !aiGenre) return;
    setAiLoading(true);
    setAiError('');
    setAiResults([]);
    try {
      const { data } = await axios.post(`${API_BASE}/ai/recommend`, {
        mood: aiMood,
        city: aiCity,
        budget: aiBudget,
        genre: aiGenre,
        groupType: 'friends',
      });
      const recommendations = Array.isArray(data) ? data : [];
      setAiResults(recommendations.length ? recommendations : AI_FALLBACK_RESULTS);
    } catch (err) {
      setAiResults(AI_FALLBACK_RESULTS);
      console.error('AI error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="home-screen">
      {/* Hero */}
      <section className="hero" id="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span>✨</span> AI-Powered Entertainment
          </div>
          <h1>FIND YOUR NEXT MOMENT</h1>
          <p className="hero-subtitle">
            Discover movies, showtimes, and tickets — personalized by AI, just for you.
          </p>
          <form className="hero-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search movies, cast, genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="hero-search-input"
            />
            <button type="submit" id="hero-search-btn">Search</button>

          </form>
        </div>
        
      </section>

      {/* AI Concierge */}
      <section className="ai-section" id="ai-section">
        <div className="ai-header">
          <h2>🤖 AI CONCIERGE</h2>
          <p>Tell us what you're in the mood for — we'll find the perfect plan</p>
        </div>

        <div className="ai-form">
          <div className="ai-form-group">
            <label>Mood</label>
            <select value={aiMood} onChange={(e) => setAiMood(e.target.value)} id="ai-mood">
              <option value="">Select mood</option>
              <option value="Happy">Happy</option>
              <option value="Romantic">Romantic</option>
              <option value="Adventurous">Adventurous</option>
              <option value="Chill">Chill</option>
              <option value="Social">Social</option>
            </select>
          </div>
          <div className="ai-form-group">
            <label>City</label>
            <select value={aiCity} onChange={(e) => setAiCity(e.target.value)} id="ai-city">
              <option value="">Select city</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Chennai">Chennai</option>
              <option value="Pune">Pune</option>
            </select>
          </div>
          <div className="ai-form-group">
            <label>Budget</label>
            <select value={aiBudget} onChange={(e) => setAiBudget(e.target.value)} id="ai-budget">
              <option value="">Select budget</option>
              <option value="Under ₹500">Under ₹500</option>
              <option value="₹500-1500">₹500–1500</option>
              <option value="₹1500+">₹1500+</option>
            </select>
          </div>
          <div className="ai-form-group">
            <label>Genre</label>
            <select value={aiGenre} onChange={(e) => setAiGenre(e.target.value)} id="ai-genre">
              <option value="">Select genre</option>
              <option value="Action">Action</option>
              <option value="Drama">Drama</option>
              <option value="Comedy">Comedy</option>
              <option value="Thriller">Thriller</option>
              <option value="Romance">Romance</option>
            </select>
          </div>
        </div>

        <button
          className="ai-ask-btn"
          onClick={handleAiAsk}
          disabled={aiLoading}
          id="ai-ask-btn"
        >
          {aiLoading ? 'Thinking...' : 'Ask AI ✨'}
        </button>

        {aiError && <p style={{ color: 'var(--danger)', textAlign: 'center', marginTop: 16 }}>{aiError}</p>}

        {aiLoading && <Loader />}

        {aiResults.length > 0 && (
          <div className="ai-results">
            {aiResults.map((item, i) => (
              <div className="ai-card" key={i}>
                <div className="ai-card-header">
                  <span className="ai-card-emoji">{item.emoji || '🎯'}</span>
                  <span className="ai-card-title">{item.title}</span>
                </div>
                <span className="ai-card-type">{item.type}</span>
                {item.venue && <p className="ai-card-venue">📍 {item.venue}</p>}
                <p className="ai-card-reason">{item.reason}</p>
                <div className="ai-card-footer">
                  <span className="ai-card-price">₹{item.estimatedPrice}</span>
                  <span className="ai-card-rating">★ {item.rating}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Movie Sections */}
      {loadingMovies ? (
        <Loader />
      ) : (
        <>
          <section className="home-section" id="trending-section">
            <h2 className="section-title">
              🔥 <span className="accent">TRENDING</span> THIS WEEK
            </h2>
            <div className="scroll-row">
              {trending.slice(0, 15).map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </section>

          <section className="home-section" id="nowplaying-section">
            <h2 className="section-title">
              🎬 <span className="accent">NOW</span> PLAYING
            </h2>
            <div className="scroll-row">
              {nowPlaying.slice(0, 15).map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </section>

          <section className="home-section" id="upcoming-section">
            <h2 className="section-title">
              📅 <span className="accent">{isFallbackUpcoming ? 'FAN' : 'COMING'}</span> {isFallbackUpcoming ? 'FAVORITES' : 'SOON'}
            </h2>
            <div className="scroll-row">
              {upcoming.slice(0, 15).map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default HomeScreen;
