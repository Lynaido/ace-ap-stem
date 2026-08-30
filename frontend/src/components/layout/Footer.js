import React from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaQuestionCircle } from 'react-icons/fa';
import './Footer.css';

const APP_STORE_URL = 'https://apps.apple.com/us/app/ace-ap-stem/id6780169317';
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.ni.AceAPSTEM';

const Footer = () => (
  <footer className="ace-footer">
    <section className="ace-mobile-promo" aria-labelledby="ace-mobile-promo-title">
      <div className="ace-mobile-promo__surface">
        <div className="ace-mobile-promo__mascot-frame" aria-hidden="true">
          <div className="ace-sprite ace-sprite--wave ace-mobile-promo__mascot" />
        </div>
        <div className="ace-mobile-promo__copy">
          <p className="ace-mobile-promo__label">ACE AP STEM mobile app</p>
          <h2 id="ace-mobile-promo-title">ACE is in your pocket.</h2>
          <p>Keep every study session close, wherever you are.</p>
        </div>
        <div className="ace-mobile-promo__stores" aria-label="Download the ACE AP STEM mobile app">
          <a href={APP_STORE_URL} target="_blank" rel="noreferrer" aria-label="Download ACE AP STEM on the App Store">
            <img src="/images/app-store-badge.svg" alt="Download on the App Store" />
          </a>
          <a href={GOOGLE_PLAY_URL} target="_blank" rel="noreferrer" aria-label="Get ACE AP STEM on Google Play">
            <img src="/images/google-play-badge.png" alt="Get it on Google Play" />
          </a>
        </div>
      </div>
    </section>

    <div className="ace-footer__shell">
      <div className="ace-footer__inner">
        <div className="ace-footer__brand">
          <Link to="/" aria-label="ACE AP STEM home">
            <img src="/logo.png" alt="ACE AP STEM logo" width="48" height="48" onError={(event) => { event.currentTarget.src = '/logo192.png'; }} />
            <span><strong>ACE</strong><small>AP STEM</small></span>
          </Link>
          <p>Your all-in-one AI-powered workspace for AP STEM success.</p>
          <div className="ace-footer__badges">
            <Link to="/contact"><FaEnvelope aria-hidden="true" /> Contact</Link>
            <Link to="/faq"><FaQuestionCircle aria-hidden="true" /> FAQ</Link>
          </div>
        </div>

        <nav className="ace-footer__links" aria-label="Footer navigation">
          <div>
            <h3>Products</h3>
            <Link to="/solve-problems">Solve a problem</Link>
            <Link to="/notes-hub">Notes Hub</Link>
            <Link to="/study-mode">Study Mode</Link>
            <Link to="/tutor">AI Tutor</Link>
          </div>
          <div>
            <h3>Resources</h3>
            <Link to="/about-us">About us</Link>
            <Link to="/faq">FAQ</Link>
            <Link to="/contact">Help Center</Link>
            <Link to="/privacy">Privacy</Link>
          </div>
        </nav>

        <div className="ace-footer__mascot-wrap" aria-hidden="true">
          <div className="ace-sprite ace-sprite--notes ace-footer__mascot" />
        </div>
      </div>

      <div className="ace-footer__bottom">
        <p>© {new Date().getFullYear()} ACE AP STEM. All rights reserved.</p>
        <p>Guidance built for understanding.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
