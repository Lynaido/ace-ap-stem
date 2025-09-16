import React from 'react';
import { Link } from 'react-router-dom';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title"><strong>Ace Your AP STEM Courses With Ease.</strong></h1>
          <p className="hero-tagline">
            Find, analyze, and organize academic papers with ease. Streamline your research, boost productivity, and gain insights faster with ScholarAI.
          </p>
          <div className="hero-buttons">
            <Link to="/sign-up" className="btn btn-primary">Sign Up Now</Link>
          </div>
          <div className="subject-badges">
            <span className="badge">AP Physics</span>
            <span className="badge">AP Calculus</span>
            <span className="badge">AP Chemistry</span>
            <span className="badge">AP Biology</span>
          </div>
        </div>
        <div className="hero-mockup">
          <img src="https://images.pexels.com/photos/33237526/pexels-photo-33237526.jpeg" alt="App Mockup" className="mockup-image" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
