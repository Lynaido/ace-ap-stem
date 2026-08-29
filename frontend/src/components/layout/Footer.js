import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-column">
          <h4>PRODUCTS</h4>
          <div className="footer-links">
            <Link to="/solve-problems">Problem Upload</Link>
            <Link to="/notes-hub">Notes Hub</Link>
            <Link to="/study-mode">Study Mode</Link>
            <a
              href="https://apps.apple.com/app/ace-ap-stem/id6476686129"
              target="_blank"
              rel="noopener noreferrer"
            >
              App Store
            </a>
          </div>
        </div>
        <div className="footer-column">
          <h4>COMPANY</h4>
          <div className="footer-links">
            <Link to="/about-us">About Us</Link>
          </div>
        </div>
        <div className="footer-column">
          <h4>SUPPORT</h4>
          <div className="footer-links">
            <Link to="/#faq">FAQ</Link>
            <Link to="/contact">Contact Us</Link>
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
