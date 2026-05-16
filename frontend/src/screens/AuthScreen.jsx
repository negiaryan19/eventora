import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../constants';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import '../styles/Auth.css';

function AuthScreen() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // 'login', 'signup', 'forgot', 'reset'
  const [view, setView] = useState('login');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [toast, setToast] = useState({ message: '', type: '' });
  const [loading, setLoading] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast({ message: '', type: '' });
  };

  const switchView = (newView) => {
    setView(newView);
    closeToast();
    setPassword('');
    setOtp('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    closeToast();
    setLoading(true);

    try {
      if (view === 'login') {
        const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
        login(data.token, data.user);
        navigate('/');
      } else if (view === 'signup') {
        if (!name.trim()) { showToast('Name is required.', 'error'); setLoading(false); return; }
        const { data } = await axios.post(`${API_BASE}/auth/signup`, { name, email, password });
        login(data.token, data.user);
        navigate('/');
      } else if (view === 'forgot') {
        const { data } = await axios.post(`${API_BASE}/auth/forgot-password`, { email });
        showToast(data.message || 'OTP sent to your email.', 'success');
        setView('reset');
      } else if (view === 'reset') {
        const { data } = await axios.post(`${API_BASE}/auth/reset-password`, { email, otp, newPassword: password });
        showToast('Password reset successfully! You can now login.', 'success');
        setView('login');
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen" id="auth-screen">
      {toast.message && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}

      <div className="auth-left">
        <div className="auth-branding">
          <h1>🎬 EVENTORA</h1>
          <p>Your AI-powered gateway to movies, showtimes, and unforgettable tickets.</p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          
          {(view === 'login' || view === 'signup') && (
            <div className="auth-tabs">
              <button
                className={`auth-tab ${view === 'login' ? 'active' : ''}`}
                onClick={() => switchView('login')}
              >
                Login
              </button>
              <button
                className={`auth-tab ${view === 'signup' ? 'active' : ''}`}
                onClick={() => switchView('signup')}
              >
                Sign Up
              </button>
            </div>
          )}

          {(view === 'forgot' || view === 'reset') && (
             <div className="auth-tabs">
              <button className="auth-tab active">
                {view === 'forgot' ? 'Forgot Password' : 'Reset Password'}
              </button>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {view === 'signup' && (
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
            
            {(view === 'login' || view === 'signup' || view === 'forgot' || view === 'reset') && (
              <div className="form-group">
                <label htmlFor="auth-email">Email</label>
                <input
                  id="auth-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={view === 'reset'}
                  required
                />
              </div>
            )}

            {view === 'reset' && (
              <div className="form-group">
                <label htmlFor="auth-otp">6-Digit OTP</label>
                <input
                  id="auth-otp"
                  type="text"
                  placeholder="Enter OTP sent to email"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
            )}

            {(view === 'login' || view === 'signup' || view === 'reset') && (
              <div className="form-group">
                <label htmlFor="auth-password">{view === 'reset' ? 'New Password' : 'Password'}</label>
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
            )}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Please wait...' : 
                view === 'login' ? 'Login' : 
                view === 'signup' ? 'Create Account' : 
                view === 'forgot' ? 'Send OTP' : 'Reset Password'
              }
            </button>

            {view === 'login' && (
              <button type="button" className="auth-forgot-link" onClick={() => switchView('forgot')} style={{ background: 'transparent', color: '#a78bfa', border: 'none', marginTop: '15px', cursor: 'pointer', textDecoration: 'underline' }}>
                Forgot Password?
              </button>
            )}

            {(view === 'forgot' || view === 'reset') && (
              <button type="button" className="auth-forgot-link" onClick={() => switchView('login')} style={{ background: 'transparent', color: '#8b8ca0', border: 'none', marginTop: '15px', cursor: 'pointer' }}>
                Back to Login
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default AuthScreen;
