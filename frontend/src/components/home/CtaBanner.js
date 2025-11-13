import React from 'react';
import { Link } from 'react-router-dom';
import './CtaBanner.css';

const CtaBanner = () => {
  return (
    <section className="cta-banner-section">
      <div className="cta-banner-container">
        <h2>Practice Smarter Today</h2>
        <p>Stop struggling and start understanding. Get the tools you need to ace your AP STEM courses.</p>
        <Link to="/solve-problems" className="btn btn-primary">Get Started Now</Link>
      </div>
    </section>
  );
};

export default CtaBanner;
