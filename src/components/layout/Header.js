import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FaBrain, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useAppContext } from '../../context/AppContext';
import './Header.css';

const Header = () => {
  const { user, isAuthenticated, logout } = useAppContext();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, we still want to show the success message
      // since the user will be logged out locally
    }
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/" className="logo">
          <div className="logo-container">
            <div className="logo-icon">
              <FaBrain />
            </div>
            <span className="logo-text">ACE AP STEM</span>
          </div>
        </Link>
        <nav className="nav-links">
          <NavLink to="/" className="nav-link">Home</NavLink>
          <NavLink to="/solve-problems" className="nav-link">Problem Upload</NavLink>
          <NavLink to="/notes-hub" className="nav-link">Notes Hub</NavLink>
          <NavLink to="/study-mode" className="nav-link">Study Mode</NavLink>
        </nav>
        <div className="header-actions">
          {isAuthenticated ? (
            <>
              <div className="user-info">
                <FaUser className="user-icon" />
                <span className="user-name">{user?.name || 'User'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-outline logout-btn"
                title="Sign Out"
              >
                <FaSignOutAlt />
              </button>
            </>
          ) : (
            <>
              <Link to="/sign-in" className="btn btn-outline"><span>Sign In</span></Link>
              <Link to="/sign-up" className="btn btn-primary"><span>Get Started</span></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
