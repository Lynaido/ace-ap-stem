import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import './CtaBanner.css';

const CtaBanner = () => (
  <section className="ace-cta" aria-labelledby="ace-cta-title">
    <div className="ace-cta__inner">
      <div className="ace-cta__copy">
        <p className="ace-section-kicker">Ready for the next problem?</p>
        <h2 id="ace-cta-title">Bring your question. ACE will help you find the next step.</h2>
        <p>Start in your browser and keep every useful step together in your learning space.</p>
        <div className="ace-cta__actions">
          <Link to="/sign-up" className="ace-cta__primary">Get started <FaArrowRight aria-hidden="true" /></Link>
          <Link to="/about-us" className="ace-cta__store">How ACE works</Link>
        </div>
      </div>
      <div className="ace-cta__visual" aria-hidden="true">
        <span className="ace-cta__star ace-cta__star--one">✦</span>
        <span className="ace-cta__star ace-cta__star--two">✦</span>
        <div className="ace-sprite ace-sprite--study ace-cta__mascot" />
      </div>
    </div>
  </section>
);

export default CtaBanner;
