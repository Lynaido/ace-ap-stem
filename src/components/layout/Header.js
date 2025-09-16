import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FaBrain } from 'react-icons/fa';
import './Header.css';

const Header = () => {
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
          <NavLink to="/concept-notes" className="nav-link">Concept Notes</NavLink>
          <NavLink to="/notes-hub" className="nav-link">Notes Hub</NavLink>
          <NavLink to="/study-mode" className="nav-link">Study Mode</NavLink>
        </nav>
        <div className="header-actions">
          <Link to="/sign-in" className="btn btn-outline">Sign In</Link>
          <Link to="/solve-problems" className="btn btn-primary">Get Started</Link>
        </div>
      </div>
    </header>
  );
};

export default Header;