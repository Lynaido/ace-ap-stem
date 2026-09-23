import React, { useEffect, useId, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  FaBars,
  FaBookOpen,
  FaChevronDown,
  FaComments,
  FaHome,
  FaLightbulb,
  FaMagic,
  FaSignOutAlt,
  FaTimes,
  FaUpload,
} from 'react-icons/fa';
import { useAppContext } from '../../context/AppContext';
import './AppShell.css';

// aceyTarget lets Acey's tour point at a navigation item.
const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: FaHome },
  { to: '/solve-problems', label: 'Solve', icon: FaUpload, aceyTarget: 'nav-solve' },
  { to: '/tutor', label: 'AI Tutor', icon: FaComments },
  { to: '/notes-hub', label: 'Notes Hub', icon: FaBookOpen, aceyTarget: 'notes-hub' },
  { to: '/study-mode', label: 'Study Mode', icon: FaLightbulb },
];

const AppShell = ({ children }) => {
  const { user, logout } = useAppContext();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigationId = useId();
  const initial = (user?.name || user?.email || 'A').charAt(0).toUpperCase();

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  return (
    <div className="product-shell">
      <header className="product-topbar">
        <div className="product-topbar__inner">
          <NavLink className="product-brand" to="/dashboard" aria-label="ACE AP STEM dashboard">
            <img src="/logo.png" alt="" width="38" height="38" />
            <span><strong>ACE</strong><small>AP STEM</small></span>
          </NavLink>

          <button
            type="button"
            className="product-shell__mobile-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            aria-controls={navigationId}
          >
            {menuOpen ? <FaTimes aria-hidden="true" /> : <FaBars aria-hidden="true" />}
          </button>

          <nav id={navigationId} className={`product-navigation${menuOpen ? ' is-open' : ''}`} aria-label="Learning workspace">
            {navigation.map(({ to, label, icon: Icon, aceyTarget }) => (
              <NavLink
                key={to}
                to={to}
                data-acey-target={aceyTarget}
                className={({ isActive }) => `product-navigation__link${isActive ? ' is-active' : ''}`}
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="product-user-menu">
            <button
              type="button"
              className="product-user-menu__trigger"
              onClick={() => setProfileOpen((open) => !open)}
              aria-expanded={profileOpen}
              aria-controls="product-user-actions"
            >
              <span className="product-avatar" aria-hidden="true">{initial}</span>
              <span className="product-user-menu__copy"><strong>{user?.name || 'ACE learner'}</strong><small>My account</small></span>
              <FaChevronDown aria-hidden="true" />
            </button>
            {profileOpen && (
              <div className="product-user-menu__panel" id="product-user-actions">
                <p>{user?.email || 'Ready to learn'}</p>
                <Link className="product-user-menu__link" to="/customize-acey">
                  <FaMagic aria-hidden="true" /> Customize ACE
                </Link>
                <button type="button" onClick={logout}><FaSignOutAlt aria-hidden="true" /> Sign out</button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="product-main">{children}</main>
      <footer className="product-footer">
        <div>
          <span><strong>ACE</strong> AP STEM</span>
          <p>Master the Concept. Ace the Problem.</p>
        </div>
        <nav aria-label="Workspace footer">
          <Link to="/about-us">About</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/contact">Support</Link>
          <Link to="/privacy">Privacy</Link>
        </nav>
      </footer>
    </div>
  );
};

export default AppShell;
