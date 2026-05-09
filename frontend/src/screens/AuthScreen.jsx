import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../constants';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

function AuthScreen() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
        login(data.token, data.user);
      } else {
        if (!name.trim()) { setError('Name is required.'); setLoading(false); return; }
        const { data } = await axios.post(`${API_BASE}/auth/signup`, { name, email, password });
        login(data.token, data.user);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen" id="auth-screen">
      <div className="auth-left">
        <div className="auth-branding">
          <h1>🎬 EVENTORA</h1>
          <p>Your AI-powered gateway to movies, events, and unforgettable experiences.</p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(true); setError(''); }}
              id="login-tab"
            >
              Login
            </button>
            <button
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(false); setError(''); }}
              id="signup-tab"
            >
              Sign Up
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="auth-name">Name</label>
                <input
                  id="auth-name"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button type="submit" className="auth-submit" disabled={loading} id="auth-submit">
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AuthScreen;
