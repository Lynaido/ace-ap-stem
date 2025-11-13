import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-column">
          <h4>Product</h4>
          <div className="footer-links">
            <Link to="/solve-problems">Solve Problems</Link>
            <Link to="/concept-notes">Concept Notes</Link>
            <Link to="/tutor">Tutor</Link>
            <Link to="/notes-hub">Notes Hub</Link>
            <Link to="/study-mode">Study Mode</Link>
          </div>
        </div>
        <div className="footer-column">
          <h4>Company</h4>
          <div className="footer-links">
            <Link to="/about-us">About Us</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
        <div className="footer-column">
          <h4>Support</h4>
          <div className="footer-links">
            <Link to="/faq">FAQ</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} AAS - Ace AP STEM. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;