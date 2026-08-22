import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import { useAppContext } from '../../context/AppContext';
import './Header.css';

const Header = () => {
  const { user, isAuthenticated, logout } = useAppContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, we still want to show the success message
      // since the user will be logged out locally
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="logo">
          <div className="logo-container">
            <div className="logo-icon" aria-label="ACE AP STEM">
              <img
                src="/logo.png"
                alt="ACE AP STEM logo"
                width="36"
                height="36"
                loading="eager"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/logo192.png';
                }}
              />
            </div>
            <span className="logo-text">ACE AP STEM</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="nav-links desktop-nav">
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" className="nav-link">Dashboard</NavLink>
              <NavLink to="/solve-problems" className="nav-link">Solve</NavLink>
              <NavLink to="/tutor" className="nav-link">AI Tutor</NavLink>
              <NavLink to="/notes-hub" className="nav-link">Notes Hub</NavLink>
              <NavLink to="/study-mode" className="nav-link">Study Mode</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/" end className="nav-link">Home</NavLink>
              <NavLink to="/about-us" className="nav-link">About</NavLink>
              <NavLink to="/contact" className="nav-link">Contact</NavLink>
              <NavLink to="/faq" className="nav-link">FAQ</NavLink>
            </>
          )}
        </nav>

        {/* Desktop Actions */}
        <div className="header-actions desktop-actions">
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

        {/* Mobile Hamburger Button */}
        <button
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Mobile Menu Backdrop */}
        <div
          className={`mobile-menu-backdrop ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-hidden="true"
        />

        {/* Mobile Menu Overlay */}
        <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}>
          <nav className="mobile-nav">
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" className="mobile-nav-link">Dashboard</NavLink>
                <NavLink to="/solve-problems" className="mobile-nav-link">Solve Problems</NavLink>
                <NavLink to="/tutor" className="mobile-nav-link">AI Tutor</NavLink>
                <NavLink to="/notes-hub" className="mobile-nav-link">Notes Hub</NavLink>
                <NavLink to="/study-mode" className="mobile-nav-link">Study Mode</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/" end className="mobile-nav-link">Home</NavLink>
                <NavLink to="/about-us" className="mobile-nav-link">About</NavLink>
                <NavLink to="/contact" className="mobile-nav-link">Contact</NavLink>
                <NavLink to="/faq" className="mobile-nav-link">FAQ</NavLink>
              </>
            )}

            <div className="mobile-menu-divider"></div>

            {isAuthenticated ? (
              <>
                <div className="mobile-user-info">
                  <FaUser className="user-icon" />
                  <span className="user-name">{user?.name || 'User'}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="mobile-logout-btn"
                >
                  <FaSignOutAlt />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/sign-in" className="mobile-nav-btn btn-outline">Sign In</Link>
                <Link to="/sign-up" className="mobile-nav-btn btn-primary">Get Started</Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
