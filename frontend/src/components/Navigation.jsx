import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navigation.css';

function Navigation() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Desktop navbar */}
      <nav className="navbar" id="main-navbar">
        <Link to="/" className="navbar-logo" id="navbar-logo">
          <span className="logo-icon">🎬</span>
          <span className="logo-text">EVENTORA</span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} id="nav-home">
            Home
          </Link>
          <Link to="/discover" className={`nav-link ${isActive('/discover') ? 'active' : ''}`} id="nav-discover">
            Discover
          </Link>
          <Link to="/tickets" className={`nav-link ${isActive('/tickets') ? 'active' : ''}`} id="nav-tickets">
            Tickets
          </Link>
        </div>

        <div className="navbar-auth">
          {isAuthenticated ? (
            <div className="user-menu">
              <Link to="/profile" className="user-avatar-btn" id="nav-profile-btn">
                <div className="avatar-circle">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="user-name">{user?.name?.split(' ')[0]}</span>
              </Link>
              <button className="logout-btn" onClick={logout} id="nav-logout-btn">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/auth" className="login-btn" id="nav-login-btn">
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className="mobile-tabbar" id="mobile-tabbar">
        <Link to="/" className={`tab-item ${isActive('/') ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Home</span>
        </Link>
        <Link to="/discover" className={`tab-item ${isActive('/discover') ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>Discover</span>
        </Link>
        <Link to="/tickets" className={`tab-item ${isActive('/tickets') ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 9a3 3 0 013-3h14a3 3 0 013 3v0a3 3 0 01-3 3v0a3 3 0 01-3 3H8a3 3 0 01-3-3v0a3 3 0 01-3-3z" />
            <path d="M13 6v12" />
          </svg>
          <span>Tickets</span>
        </Link>
        <Link to={isAuthenticated ? '/profile' : '/auth'} className={`tab-item ${isActive('/profile') || isActive('/auth') ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>{isAuthenticated ? 'Profile' : 'Login'}</span>
        </Link>
      </nav>
    </>
  );
}

export default Navigation;
