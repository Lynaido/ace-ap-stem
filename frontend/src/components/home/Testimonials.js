import React from 'react';
import './Testimonials.css';

const Testimonials = () => {
  return (
    <section className="testimonials-section">
      <div className="testimonials-container">
        <h2>What Students Are Saying</h2>
        <div className="testimonial-card">
          <p className="testimonial-text">
            This was a lifesaver for AP Physics. The step-by-step hints are way more helpful than just getting the answer. I actually understand the concepts now.
          </p>
          <div className="testimonial-author">
            Alex Johnson
            <span>High School Junior</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
