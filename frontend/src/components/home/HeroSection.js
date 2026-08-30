import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowRight,
  FaAtom,
  FaCode,
  FaFlask,
  FaSquareRootAlt,
} from 'react-icons/fa';
import { useAppContext } from '../../context/AppContext';
import './HeroSection.css';

const subjectTiles = [
  { label: 'AP Physics', icon: FaAtom, tone: 'blue' },
  { label: 'AP Chemistry', icon: FaFlask, tone: 'pink' },
  { label: 'AP Calculus', icon: FaSquareRootAlt, tone: 'orange' },
  { label: 'AP Computer Science', icon: FaCode, tone: 'green' },
];

const HeroSection = () => {
  const { isAuthenticated } = useAppContext();

  return (
    <section className="ace-hero" aria-labelledby="ace-hero-title">
      <div className="ace-hero__glow ace-hero__glow--one" aria-hidden="true" />
      <div className="ace-hero__glow ace-hero__glow--two" aria-hidden="true" />

      <div className="ace-hero__inner">
        <div className="ace-hero__copy">
          <p className="ace-section-kicker">Your AP STEM study companion</p>
          <h1 id="ace-hero-title">
            Master AP STEM <span className="ace-gradient-text">with an AI companion.</span>
          </h1>
          <p className="ace-hero__lede">
            Choose a question, get focused guidance, and keep every solution, hint, and concept note connected.
          </p>

          <div className="ace-hero__actions">
            <Link className="ace-hero__primary" to={isAuthenticated ? '/solve-problems' : '/sign-up'}>
              {isAuthenticated ? 'Open your workspace' : 'Start learning'}
              <FaArrowRight aria-hidden="true" />
            </Link>
            <a className="ace-hero__secondary" href="#ace-demo">Watch the product tour</a>
          </div>

          <div className="ace-hero__trust" aria-label="Available learning flow">
            <span>Upload or type</span>
            <span>Choose the exact part</span>
            <span>Learn and save</span>
          </div>
        </div>

        <div className="ace-hero__visual" aria-label="ACE study companion supports AP STEM subjects">
          <div className="ace-hero__orbit" aria-hidden="true" />
          <div className="ace-sprite ace-sprite--wave ace-hero__mascot" aria-hidden="true" />

          {subjectTiles.map(({ label, icon: Icon, tone }, index) => (
            <div key={label} className={`ace-hero__subject ace-hero__subject--${index + 1} ace-hero__subject--${tone}`}>
              <span><Icon aria-hidden="true" /></span>
              <strong>{label}</strong>
            </div>
          ))}

          <div className="ace-hero__speech">
            <span aria-hidden="true">✦</span>
            <p>Hi, I am ACE. What are we learning today?</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
