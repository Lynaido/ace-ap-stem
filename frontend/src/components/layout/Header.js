import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FaArrowRight, FaBars, FaSignOutAlt, FaTimes, FaUser } from 'react-icons/fa';
import { useAppContext } from '../../context/AppContext';
import './Header.css';

const publicLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/#features', label: 'Features' },
  { to: '/#meet-ace', label: 'Study Buddy' },
  { to: '/about-us', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/faq', label: 'FAQ' },
];

const productLinks = [
  { to: '/dashboard', label: 'Dashboard', end: true },
  { to: '/solve-problems', label: 'Solve' },
  { to: '/tutor', label: 'AI Tutor' },
  { to: '/notes-hub', label: 'Notes Hub' },
  { to: '/study-mode', label: 'Study Mode' },
];

const Header = () => {
  const { user, isAuthenticated, logout } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef(null);
  const location = useLocation();
  const navigationLinks = isAuthenticated ? productLinks : publicLinks;

  useEffect(() => setIsOpen(false), [location]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        window.requestAnimationFrame(() => toggleRef.current?.focus());
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getPublicAnchorClassName = (to, className) => {
    const isHome = to === '/';
    const isHashLink = to.includes('#');
    const isActive = isHome
      ? location.pathname === '/' && !location.hash
      : isHashLink && location.pathname === '/' && location.hash === to.slice(to.indexOf('#'));

    return `${className}${isActive ? ' active' : ''}`;
  };

  const renderLinks = (className) => navigationLinks.map(({ to, label, end }) => {
    const isPublicAnchor = !isAuthenticated && (to === '/' || to.includes('#'));

    return isPublicAnchor ? (
      <Link key={to} to={to} className={getPublicAnchorClassName(to, className)}>{label}</Link>
    ) : (
      <NavLink key={to} to={to} end={end} className={className}>{label}</NavLink>
    );
  });

  return (
    <header className="ace-public-nav">
      <div className="ace-public-nav__inner">
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="ace-public-nav__brand" aria-label="ACE AP STEM home">
          <img src="/logo.png" alt="" width="38" height="38" onError={(event) => { event.currentTarget.src = '/logo192.png'; }} />
          <span>ACE AP STEM</span>
        </Link>

        <nav className="ace-public-nav__links" aria-label="Main navigation">
          {renderLinks('ace-public-nav__link')}
        </nav>

        <div className="ace-public-nav__actions">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="ace-public-nav__user"><FaUser aria-hidden="true" /><span>{user?.name || 'Your workspace'}</span></Link>
              <button type="button" onClick={handleLogout} className="ace-public-nav__logout" aria-label="Sign out"><FaSignOutAlt aria-hidden="true" /></button>
            </>
          ) : (
            <>
              <Link to="/sign-in" className="ace-public-nav__signin">Sign in</Link>
              <Link to="/sign-up" className="ace-public-nav__signup">Get started <FaArrowRight aria-hidden="true" /></Link>
            </>
          )}
        </div>

        <button
          ref={toggleRef}
          type="button"
          className="ace-public-nav__toggle"
          aria-expanded={isOpen}
          aria-controls="ace-mobile-navigation"
          aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
          onClick={() => setIsOpen((value) => !value)}
        >
          {isOpen ? <FaTimes aria-hidden="true" /> : <FaBars aria-hidden="true" />}
        </button>
      </div>

      {isOpen && (
        <>
          <div className="ace-public-nav__backdrop is-open" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div id="ace-mobile-navigation" className="ace-public-nav__drawer is-open">
            <nav aria-label="Mobile navigation">{renderLinks('ace-public-nav__mobile-link')}</nav>
            <div className="ace-public-nav__mobile-actions">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="ace-public-nav__mobile-primary">Open workspace</Link>
                  <button type="button" onClick={handleLogout}><FaSignOutAlt aria-hidden="true" /> Sign out</button>
                </>
              ) : (
                <>
                  <Link to="/sign-in">Sign in</Link>
                  <Link to="/sign-up" className="ace-public-nav__mobile-primary">Get started</Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
