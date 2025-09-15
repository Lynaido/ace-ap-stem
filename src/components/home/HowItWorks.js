import React from 'react';
import { Link } from 'react-router-dom';
import './HowItWorks.css';

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="how-it-works-section">
      <div className="how-it-works-container">
        <h2>How It Works</h2>
        <p>Get unstuck in three simple steps. From a tricky problem to a full concept review, we've got you covered.</p>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Add a Problem</h3>
            <p>Snap a picture or type out any problem from your AP STEM coursework.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Choose Your Help</h3>
            <p>Select from step-by-step hints, a full solution, or a deep-dive into related concepts.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Learn & Save</h3>
            <p>Understand the solution, chat with the AI tutor for clarity, and save everything to your Notes Hub.</p>
          </div>
        </div>
        <div className="cta-row">
          <p>Ready to try it yourself?</p>
          <Link to="/solve-problems" className="btn btn-primary">Solve a Problem</Link>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
