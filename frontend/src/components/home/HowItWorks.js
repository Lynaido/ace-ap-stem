import React from 'react';
import { Link } from 'react-router-dom';
import './HowItWorks.css';

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="how-it-works-section">
      <div className="how-it-works-container">
        <h2>How It Works</h2>
        <p>Move from a complex prompt to the exact support you need in three clear steps.</p>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Add a Problem</h3>
            <p>Snap a picture or type out any problem from your AP STEM coursework.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Choose the Exact Part</h3>
            <p>When ACE detects multiple questions or sub-parts, select all of them or focus on just one.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Learn and Save</h3>
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
