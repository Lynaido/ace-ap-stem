import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaCheck, FaPlay } from 'react-icons/fa';
import { useAppContext } from '../../context/AppContext';
import AceyScene from './AceyScene';
import './HeroSection.css';

// Feet position (x, y) and height (h) in % of the 16:9 scene, measured from
// the camera that rendered /hero/home-scene.webp (tmp/hero-scene.html).
const HOME_CHARACTERS = [
  { id: 'classic', x: 57.99, y: 52.56, h: 22, depth: -2.2 },
  { id: 'graduation', x: 90.14, y: 47.23, h: 21.34, depth: -3.2 },
  { id: 'long-vest', x: 46.27, y: 69.9, h: 23.84, depth: -0.4 },
  { id: 'artist', x: 87.24, y: 67.9, h: 26.07, depth: 0.4 },
  { id: 'original', x: 72.99, y: 84.91, h: 40.84, depth: 1.4 },
  { id: 'cloak', x: 58.07, y: 88.08, h: 31.18, depth: 3.3 },
  { id: 'hoodie', x: 98.34, y: 88.84, h: 31.79, depth: 3.5 },
].map((character) => ({ ...character, src: `/hero/acey-${character.id}.webp` }));

const SPARKLES = [
  { x: 49, y: 22, size: 16 },
  { x: 67, y: 12, size: 12, tone: 'pink' },
  { x: 97, y: 36, size: 14, tone: 'violet' },
  { x: 63, y: 44, size: 10, tone: 'white' },
  { x: 80, y: 30, size: 11 },
];

const STATS = [
  { icon: 'cap', value: 500, suffix: '+', label: 'Students supported' },
  { icon: 'doc', value: 10000, suffix: '+', label: 'Problems solved' },
  { icon: 'spark', value: 4.9, decimals: 1, suffix: '/5', label: 'User satisfaction' },
  { icon: 'books', value: 10, suffix: '+', label: 'AP STEM subjects' },
];

const StatIcon = ({ name }) => {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24', 'aria-hidden': true };
  if (name === 'cap') return <svg {...common}><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c2 2 10 2 12 0v-5M22 9v6" /></svg>;
  if (name === 'doc') return <svg {...common}><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 12h7M9 16h7" /></svg>;
  if (name === 'spark') return <svg {...common}><path d="M12 3c.6 4.8 2.4 7.4 8 9-5.6 1.6-7.4 4.2-8 9-.6-4.8-2.4-7.4-8-9 5.6-1.6 7.4-4.2 8-9z" /></svg>;
  if (name === 'books') return <svg {...common}><path d="M4 19h13M6 19V8h4v11M12 19V5h4v14M17.4 19l2.6-9.6-3.4-.9" /></svg>;
  return <svg {...common}><path d="M12 20C6.5 16.2 3 12.9 3 8.7 3 6 5 4 7.6 4c1.8 0 3.4 1 4.4 2.5C13 5 14.6 4 16.4 4 19 4 21 6 21 8.7c0 4.2-3.5 7.5-9 11.3z" /></svg>;
};

// Counts up once the stats card scrolls into view.
const CountUp = ({ value, decimals = 0, suffix = '' }) => {
  const ref = useRef(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const node = ref.current;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!node || reduce || typeof IntersectionObserver !== 'function') return undefined;
    let frame = 0;
    setShown(0);
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / 1600);
        setShown(value * (1 - (1 - t) ** 4));
        if (t < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    }, { threshold: 0.4 });
    observer.observe(node);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [value]);

  const text = shown.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return <span ref={ref}>{text}{suffix}</span>;
};

const HeroSection = () => {
  const { isAuthenticated } = useAppContext();

  return (
    <section className="ace-hero" aria-labelledby="ace-hero-title">
      <AceyScene
        className="ace-hero__scene"
        scene={{ large: '/hero/home-scene.webp', small: '/hero/home-scene-sm.webp' }}
        over="/hero/home-over.webp"
        characters={HOME_CHARACTERS}
        sparkles={SPARKLES}
        focusX={1}
        focusY={1}
      />
      <div className="ace-hero__veil" aria-hidden="true" />

      <div className="ace-hero__inner">
        <div className="ace-hero__copy">
          <p className="ace-hero__kicker ace-hero__reveal" style={{ '--i': 0 }}>Your AP STEM study companion</p>
          <h1 id="ace-hero-title" className="ace-hero__reveal" style={{ '--i': 1 }}>
            Master<br />AP STEM<br /><span className="ace-hero__brand">with ACEy.</span>
          </h1>
          <p className="ace-hero__lede ace-hero__reveal" style={{ '--i': 2 }}>
            Solve problems, get step-by-step hints, build deeper understanding — with ACEy by your side.
          </p>

          <div className="ace-hero__actions ace-hero__reveal" style={{ '--i': 3 }}>
            <Link className="ace-hero__primary" to={isAuthenticated ? '/solve-problems' : '/sign-up'}>
              {isAuthenticated ? 'Open your workspace' : 'Start learning'}
              <FaArrowRight aria-hidden="true" />
            </Link>
            <a className="ace-hero__secondary" href="#ace-demo">
              <span className="ace-hero__play"><FaPlay aria-hidden="true" /></span>
              Watch the video
            </a>
          </div>

          <ul className="ace-hero__trust ace-hero__reveal" style={{ '--i': 4 }} aria-label="How ACEy helps">
            <li><FaCheck aria-hidden="true" />Upload or type</li>
            <li><FaCheck aria-hidden="true" />Step-by-step guidance</li>
            <li><FaCheck aria-hidden="true" />Personalized practice</li>
          </ul>
        </div>
      </div>

      <div className="ace-hero__bottom">
        <ul className="ace-hero__stats" aria-label="ACE AP STEM at a glance">
          {STATS.map((stat) => (
            <li key={stat.label}>
              <span className="ace-hero__stat-icon"><StatIcon name={stat.icon} /></span>
              <strong>{stat.text || <CountUp value={stat.value} decimals={stat.decimals} suffix={stat.suffix} />}</strong>
              <span>{stat.label}</span>
            </li>
          ))}
        </ul>
        <a className="ace-hero__scroll" href="#ace-demo" aria-label="Scroll to the product demo">
          <span className="ace-hero__mouse" aria-hidden="true"><i /></span>
          <span>Scroll</span>
          <FaArrowRight className="ace-hero__scroll-arrow" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
};

export default HeroSection;
