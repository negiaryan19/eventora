import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE, TMDB_IMAGE } from '../constants';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import '../styles/Profile.css';

const ALL_GENRES = ['Action', 'Comedy', 'Drama', 'Thriller', 'Horror', 'Romance', 'Sci-Fi', 'Animation'];

function ProfileScreen() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prefGenres, setPrefGenres] = useState([]);
  const [prefCity, setPrefCity] = useState('');
  const [prefBudget, setPrefBudget] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchBookings();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(data);
      setPrefGenres(data.preferences?.genres || []);
      setPrefCity(data.preferences?.city || '');
      setPrefBudget(data.preferences?.budget || '');
    } catch (err) {
      console.error('Profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/booking/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(data.slice(0, 3));
    } catch (err) {
      console.error('Bookings error:', err);
    }
  };

  const toggleGenre = (genre) => {
    setPrefGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const savePref = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API_BASE}/auth/preferences`,
        { genres: prefGenres, city: prefCity, budget: prefBudget },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Save pref error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) return <Loader />;
  if (!profile) return null;

  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-IN', {
    month: 'long', year: 'numeric',
  });

  return (
    <div className="profile-screen" id="profile-screen">
      <div className="profile-header">
        <div className="profile-avatar">
          {profile.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <h2 className="profile-name">{profile.name}</h2>
        <p className="profile-email">{profile.email}</p>
        <p className="profile-since">Member since {memberSince}</p>
      </div>

      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-number">{bookings.length}</div>
          <div className="stat-label">Bookings</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{profile.favorites?.length || 0}</div>
          <div className="stat-label">Favorites</div>
        </div>
      </div>

      <div className="profile-section">
        <h2>PREFERENCES</h2>
        <div className="pref-form">
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'block' }}>
              Favorite Genres
            </label>
            <div className="pref-genres">
              {ALL_GENRES.map((g) => (
                <label key={g} className={`pref-genre-check ${prefGenres.includes(g) ? 'checked' : ''}`}>
                  <input type="checkbox" checked={prefGenres.includes(g)} onChange={() => toggleGenre(g)} />
                  {g}
                </label>
              ))}
            </div>
          </div>

          <div className="pref-row">
            <div className="form-group">
              <label>City</label>
              <select value={prefCity} onChange={(e) => setPrefCity(e.target.value)} style={{
                padding: '14px 16px', background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 8, color: 'var(--text)', fontSize: 14, appearance: 'none',
              }}>
                <option value="">Select city</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi">Delhi</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Chennai">Chennai</option>
                <option value="Pune">Pune</option>
              </select>
            </div>
            <div className="form-group">
              <label>Budget</label>
              <select value={prefBudget} onChange={(e) => setPrefBudget(e.target.value)} style={{
                padding: '14px 16px', background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 8, color: 'var(--text)', fontSize: 14, appearance: 'none',
              }}>
                <option value="">Select budget</option>
                <option value="Under ₹500">Under ₹500</option>
                <option value="₹500-1500">₹500–1500</option>
                <option value="₹1500+">₹1500+</option>
              </select>
            </div>
          </div>

          <button className="pref-save" onClick={savePref} disabled={saving} id="save-prefs-btn">
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {bookings.length > 0 && (
        <div className="profile-section">
          <h2>RECENT BOOKINGS</h2>
          <div className="profile-bookings">
            {bookings.map((b) => (
              <div className="profile-booking-item" key={b._id}>
                <div className="profile-booking-poster">
                  <img src={b.moviePoster ? `${TMDB_IMAGE}${b.moviePoster}` : 'https://via.placeholder.com/50x75'} alt={b.movieTitle} />
                </div>
                <div className="profile-booking-info">
                  <p className="profile-booking-title">{b.movieTitle}</p>
                  <p className="profile-booking-meta">{b.seats.join(', ')} · {b.showtime} · ₹{b.totalAmount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="profile-logout" onClick={handleLogout} id="profile-logout-btn">
        Logout
      </button>
    </div>
  );
}

export default ProfileScreen;
