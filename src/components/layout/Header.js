import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/" className="logo">AAS</Link>
        <nav className="nav-links">
          <NavLink to="/solve-problems" className="nav-link">Solve Problems</NavLink>
          <NavLink to="/concept-notes" className="nav-link">Concept Notes</NavLink>
          <NavLink to="/tutor" className="nav-link">Tutor</NavLink>
          <NavLink to="/notes-hub" className="nav-link">Notes Hub</NavLink>
          <NavLink to="/study-mode" className="nav-link">Study Mode</NavLink>
          <NavLink to="/about-us" className="nav-link">About Us</NavLink>
        </nav>
        <div className="header-actions">
          <Link to="/sign-in" className="btn btn-secondary">Sign In</Link>
          <Link to="/solve-problems" className="btn btn-primary">Get Started</Link>
        </div>
      </div>
    </header>
  );
};

export default Header;