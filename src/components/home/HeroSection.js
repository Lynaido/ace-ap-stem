import React from 'react';
import { Link } from 'react-router-dom';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-content">
          <h1>Ace your AP STEM courses.</h1>
          <p>
            Upload a problem…hints, concepts, or a full solution—plus an on-demand tutor.
          </p>
          <div className="hero-buttons">
            <Link to="/solve-problems" className="btn btn-primary">Try Solving a Problem</Link>
            <a href="#how-it-works" className="btn btn-secondary">See How It Works</a>
          </div>
          <div className="subject-badges">
            <span className="badge">AP Physics</span>
            <span className="badge">AP Calculus</span>
            <span className="badge">AP Chemistry</span>
            <span className="badge">AP Biology</span>
          </div>
        </div>
        <div className="hero-mockup">
          <p>UI Mockup Placeholder</p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
