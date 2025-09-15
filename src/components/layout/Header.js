import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/" className="logo">AAS</Link>
        <nav className="nav-links">
          <NavLink to="/" className="nav-link">Home</NavLink>
          <NavLink to="/solve-problems" className="nav-link">Solutions</NavLink>
          <NavLink to="/about-us" className="nav-link">Affiliates</NavLink>
          <NavLink to="/blog" className="nav-link">Blog</NavLink>
        </nav>
        <div className="header-actions">
          <Link to="/sign-in" className="btn btn-primary">Sign In</Link>
        </div>
      </div>
    </header>
  );
};

export default Header;