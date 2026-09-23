import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaBookOpen, FaFolderOpen, FaLightbulb } from 'react-icons/fa';
import './FeatureCards.css';

const FeatureCards = () => (
  <section className="ace-capabilities" id="features" aria-labelledby="ace-capabilities-title">
    <div className="ace-capabilities__inner">
      <header className="ace-capabilities__header">
        <div>
          <p className="ace-section-kicker">Your learning toolkit</p>
          <h2 id="ace-capabilities-title" className="ace-section-title">
            <span className="ace-headline-line">Master the Concept.</span>{' '}
            <span className="ace-headline-line ace-headline-accent">Ace the Problem.</span>
          </h2>
        </div>
      </header>

      <div className="ace-capabilities__grid">
        <Link to="/solve-problems" className="ace-capability ace-capability--solve">
          <div className="ace-capability__copy">
            <span className="ace-capability__index">01</span>
            <p className="ace-capability__label">Solve a problem</p>
            <h3>Focus on the exact question or sub-part.</h3>
            <p>Upload or type, choose what to solve, then keep full solutions, guided hints and concept notes aligned.</p>
            <ul>
              <li><FaLightbulb aria-hidden="true" /> Step-by-step hints</li>
              <li><FaBookOpen aria-hidden="true" /> Connected concept notes</li>
            </ul>
            <span className="ace-capability__link">Start solving <FaArrowRight aria-hidden="true" /></span>
          </div>
          <div className="ace-sprite ace-sprite--solve ace-capability__mascot" aria-hidden="true" />
        </Link>

        <Link to="/notes-hub" className="ace-capability ace-capability--notes">
          <div className="ace-capability__icon"><FaFolderOpen aria-hidden="true" /></div>
          <div className="ace-capability__copy">
            <span className="ace-capability__index">02</span>
            <p className="ace-capability__label">Notes Hub</p>
            <h3>Return to the whole learning record.</h3>
            <p>Organize problems, complete solutions, hints and rendered math in folders you can search.</p>
            <span className="ace-capability__link">Open Notes Hub <FaArrowRight aria-hidden="true" /></span>
          </div>
          <div className="ace-sprite ace-sprite--notes ace-capability__mascot" aria-hidden="true" />
        </Link>

        <Link to="/study-mode" className="ace-capability ace-capability--study">
          <div className="ace-capability__copy">
            <span className="ace-capability__index">03</span>
            <p className="ace-capability__label">Study Mode</p>
            <h3>Turn saved learning into active practice.</h3>
            <p>Select your material and build the right review experience for the next study session.</p>
            <span className="ace-capability__link">Choose a study mode <FaArrowRight aria-hidden="true" /></span>
          </div>
          <div className="ace-sprite ace-sprite--study ace-capability__mascot" aria-hidden="true" />
        </Link>
      </div>
    </div>
  </section>
);

export default FeatureCards;
