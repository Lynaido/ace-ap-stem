import React from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaQuestionCircle } from 'react-icons/fa';
import './Footer.css';

const Footer = () => (
  <footer className="ace-footer">
    <div className="ace-footer__stars" aria-hidden="true">✦　·　✦　·　✦</div>
    <div className="ace-footer__inner">
      <div className="ace-footer__brand">
        <Link to="/" aria-label="ACE AP STEM home">
          <img src="/logo.png" alt="" width="42" height="42" onError={(event) => { event.currentTarget.src = '/logo192.png'; }} />
          <strong>ACE AP STEM</strong>
        </Link>
        <p>Focused AI guidance for AP STEM learners, from the exact question to the notes worth keeping.</p>
        <div className="ace-footer__badges">
          <Link to="/contact"><FaEnvelope aria-hidden="true" /> Contact</Link>
          <Link to="/faq"><FaQuestionCircle aria-hidden="true" /> FAQ</Link>
        </div>
      </div>

      <div className="ace-footer__links">
        <div>
          <h4>Learn</h4>
          <Link to="/solve-problems">Solve a problem</Link>
          <Link to="/notes-hub">Notes Hub</Link>
          <Link to="/study-mode">Study Mode</Link>
          <Link to="/tutor">AI Tutor</Link>
        </div>
        <div>
          <h4>Explore</h4>
          <Link to="/about-us">About us</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/contact">Support</Link>
          <Link to="/privacy">Privacy</Link>
        </div>
      </div>

      <div className="ace-footer__mascot-wrap" aria-hidden="true">
        <div className="ace-sprite ace-sprite--wave ace-footer__mascot" />
      </div>
    </div>

    <div className="ace-footer__bottom">
      <p>© {new Date().getFullYear()} ACE AP STEM. All rights reserved.</p>
      <p>Built to help learners understand, not just answer.</p>
    </div>
  </footer>
);

export default Footer;
