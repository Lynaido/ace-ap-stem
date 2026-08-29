import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FaBars,
  FaBookOpen,
  FaComments,
  FaHome,
  FaLightbulb,
  FaSignOutAlt,
  FaTimes,
  FaUpload,
} from 'react-icons/fa';
import { useAppContext } from '../../context/AppContext';
import './AppShell.css';

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: FaHome },
  { to: '/solve-problems', label: 'Solve', icon: FaUpload },
  { to: '/tutor', label: 'AI Tutor', icon: FaComments },
  { to: '/notes-hub', label: 'Notes Hub', icon: FaBookOpen },
  { to: '/study-mode', label: 'Study Mode', icon: FaLightbulb },
];

const AppShell = ({ children }) => {
  const { user, logout } = useAppContext();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <div className="product-shell">
      <button
        type="button"
        className="product-shell__mobile-toggle"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={menuOpen}
      >
        {menuOpen ? <FaTimes /> : <FaBars />}
      </button>

      <aside className={`product-sidebar${menuOpen ? ' is-open' : ''}`}>
        <NavLink className="product-brand" to="/dashboard">
          <img src="/logo.png" alt="" width="42" height="42" />
          <span>
            <strong>ACE</strong>
            <small>AP STEM</small>
          </span>
        </NavLink>

        <nav className="product-navigation" aria-label="Learning workspace">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `product-navigation__link${isActive ? ' is-active' : ''}`}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="product-sidebar__profile">
          <span className="product-avatar" aria-hidden="true">
            {(user?.name || user?.email || 'A').charAt(0).toUpperCase()}
          </span>
          <span className="product-profile-copy">
            <strong>{user?.name || 'ACE learner'}</strong>
            <small>{user?.email || 'Ready to learn'}</small>
          </span>
          <button type="button" onClick={logout} aria-label="Sign out" title="Sign out">
            <FaSignOutAlt aria-hidden="true" />
          </button>
        </div>
      </aside>

      {menuOpen && (
        <button
          className="product-shell__backdrop"
          type="button"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main className="product-main">{children}</main>
    </div>
  );
};

export default AppShell;
