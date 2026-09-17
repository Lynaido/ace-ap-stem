import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowDown, FaArrowRight, FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import '@fontsource/caveat/600.css';
import './AboutUsPage.css';

const TRAITS = [
  { id: 'curious', title: 'Curious', text: 'Always asking “why?”', tone: 'violet' },
  { id: 'encouraging', title: 'Encouraging', text: 'Mistakes are part of learning.', tone: 'yellow' },
  { id: 'patient', title: 'Patient', text: 'Breaks big problems into smaller steps.', tone: 'blue' },
  { id: 'human', title: 'Human-centered', text: 'Technology should make learning feel more approachable.', tone: 'pink' },
];

const CLOSER_LOOK = [
  { id: 'brain', text: 'A brain\nfor curiosity', x: 3, y: 17 },
  { id: 'eyes', text: 'Big eyes\nfor new\nperspectives', x: 1, y: 40 },
  { id: 'bulb', text: 'A lightbulb\nfor bright\nideas', x: 7, y: 70 },
  { id: 'color', text: 'Colorful\nbecause learning\nshould be fun', x: 74, y: 8 },
  { id: 'glasses', text: 'Glasses to\nlook closer', x: 82, y: 38 },
  { id: 'smile', text: 'A smile\nto remind you\nyou can do it', x: 78, y: 62 },
];

const STEPS = [
  {
    id: 'sketch',
    title: 'The Sketch',
    text: 'Early sketches exploring different combinations of a brain, a lightbulb, and a robot.',
    image: '/about/process-sketch.webp',
    alt: 'Black and white sketches of a lightbulb character with a robot face and a brain',
  },
  {
    id: 'shape',
    title: 'The Shape',
    text: 'We gave the sketch volume, testing shapes, proportions, and expressions in 3D.',
    image: '/about/process-shape.webp',
    alt: 'Grey 3D sculpts of Acey in Blender and Maya',
  },
  {
    id: 'experiments',
    title: 'The Experiments',
    text: 'ACEY tried on many styles — scientist, wizard, artist, graduate — until his true personality stood out.',
    image: '/about/process-experiments.webp',
    alt: 'A grey wizard sculpt of Acey next to coloured wizard, artist, doctor and graduate versions',
  },
  {
    id: 'final',
    title: 'The ACEY We Know',
    text: 'After countless adjustments, ACEY finally became ACEY — ready to learn and grow with you.',
    image: '/about/process-final.webp',
    alt: 'The finished colourful Acey in a purple hoodie beside two pastel renders',
  },
];

const GALLERY = [
  ['sketch-paper', 'First paper sketches: robot, circuits or a brain inside the bulb?'],
  ['sketch-wave', 'The very first waving lightbulb buddy'],
  ['logo-round', 'Icon explorations with a robot face and a brain'],
  ['logo-pair', 'Choosing between a smiling face and a robot face'],
  ['logo-glasses', 'Glasses arrive, and the brain grows curly'],
  ['logo-moods', 'Testing expressions: wink, wonder, curious, sleepy'],
  ['sculpt-blender', 'First 3D sculpt with a simple rig'],
  ['sculpt-maya', 'Refining the sculpt: waving arm and friendly smile'],
  ['color-first', 'First colour pass in soft violet'],
  ['color-front', 'Big glossy eyes and a happy mouth'],
  ['color-side', 'Checking the side view'],
  ['color-soft', 'Pastel brain, rosy cheeks and a warm glow'],
  ['color-wave', 'A friendly three-quarter wave'],
  ['color-back', 'The back of the brain gets its curls'],
  ['outfit-technician', 'Trying a technician outfit with a tool belt'],
  ['outfit-wizard', 'Sculpting the wizard hat and robe'],
  ['outfit-texture', 'Painting textures for the outfits'],
  ['acey-hoodie', 'ACEY in his cozy study hoodie'],
].map(([id, caption]) => ({
  id,
  caption,
  thumb: `/about/gallery-${id}-thumb.webp`,
  full: `/about/gallery-${id}.webp`,
}));

const BELIEFS = [
  { id: 'understand', title: 'Understand', text: 'Break down complex problems into clear ideas.' },
  { id: 'practice', title: 'Practice', text: 'Apply what you learn with guided problem solving.' },
  { id: 'independent', title: 'Become independent', text: 'Build the skills and confidence to take on new challenges.' },
];

const Heart = ({ className = '' }) => (
  <svg className={`ace-about__heart ${className}`} viewBox="0 0 24 22" aria-hidden="true">
    <path d="M12 20.5C6 16.3 2 12.6 2 7.9 2 4.9 4.3 2.5 7.2 2.5c2 0 3.7 1.1 4.8 2.8 1.1-1.7 2.8-2.8 4.8-2.8 2.9 0 5.2 2.4 5.2 5.4 0 4.7-4 8.4-10 12.6z" />
  </svg>
);

const Star = ({ className = '', style }) => (
  <svg className={`ace-about__star ${className}`} style={style} viewBox="0 0 40 40" aria-hidden="true">
    <path d="M20 3.5c1.2 0 2 .7 2.6 2l3.6 7.4 8.1 1.2c1.4.2 2.3.9 2.6 2 .4 1.2-.1 2.2-1.1 3.1l-5.9 5.7 1.4 8.1c.2 1.4-.2 2.5-1.2 3.1-1 .7-2.1.6-3.4-.1L20 32.2 12.8 36c-1.3.7-2.4.8-3.4.1-1-.6-1.4-1.7-1.2-3.1l1.4-8.1-5.9-5.7c-1-1-1.5-1.9-1.1-3.1.3-1.1 1.2-1.8 2.6-2l8.1-1.2 3.6-7.4c.6-1.3 1.4-2 2.6-2z" />
  </svg>
);

const Sparkle = ({ className = '', style }) => (
  <svg className={`ace-about__sparkle ${className}`} style={style} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 1c.6 5.6 2.4 8.9 11 11-8.6 2.1-10.4 5.4-11 11-.6-5.6-2.4-8.9-11-11 8.6-2.1 10.4-5.4 11-11z" />
  </svg>
);

const TraitIcon = ({ id }) => {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (id === 'curious') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true" {...common}>
        <path d="M24 11c-2-3.5-8-4-10.5-.5-3.5-.5-6.5 3-5 6.5-3 1.5-3.5 6.5-.5 8.5-1 3.5 2 7.5 6 6.5 1.5 3.5 7 4 10 1V11z" />
        <path d="M24 11c2-3.5 8-4 10.5-.5 3.5-.5 6.5 3 5 6.5 3 1.5 3.5 6.5.5 8.5 1 3.5-2 7.5-6 6.5-1.5 3.5-7 4-10 1" />
        <path d="M17 17c2 0 3 1.5 3 3M31 17c-2 0-3 1.5-3 3M15 26c2-1 4-.5 5 1M33 26c-2-1-4-.5-5 1" />
      </svg>
    );
  }
  if (id === 'encouraging') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true" {...common}>
        <path d="M24 12c-6.6 0-11 4.8-11 10.5 0 4 2.2 6.4 4.3 8.6 1.3 1.4 1.7 2.7 1.7 4.4h10c0-1.7.4-3 1.7-4.4 2.1-2.2 4.3-4.6 4.3-8.6C35 16.8 30.6 12 24 12z" />
        <path d="M19.5 39h9M21 43h6M24 4v3M10 9l2.2 2.2M38 9l-2.2 2.2M5 21h3M40 21h3" />
      </svg>
    );
  }
  if (id === 'patient') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true" {...common}>
        <circle cx="14.5" cy="25" r="8.5" />
        <circle cx="33.5" cy="25" r="8.5" />
        <path d="M23 24c.7-1 1.4-1.4 1-1.4s.3.4 1 1.4M6 22l-3-4M42 22l3-4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...common}>
      <path d="M24 40C13 32.4 6 25.8 6 17.4 6 12 10.1 7.6 15.3 7.6c3.6 0 6.7 2 8.7 5 2-3 5.1-5 8.7-5C37.9 7.6 42 12 42 17.4 42 25.8 35 32.4 24 40z" />
    </svg>
  );
};

const BeliefIcon = ({ id }) => {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (id === 'understand') return <TraitIcon id="curious" />;
  if (id === 'practice') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true" {...common}>
        <circle cx="22" cy="26" r="15" />
        <circle cx="22" cy="26" r="8.5" />
        <circle cx="22" cy="26" r="2.5" />
        <path d="M22 26L39 9M33 9h6v6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...common}>
      <path d="M8 41h32M12 41V29h6v12M21 41V20h6v21M30 41V10h6v31" />
    </svg>
  );
};

/* Hero props drawn inline so they stay crisp and on-brand at every size. */
const HeroBooks = () => (
  <svg className="ace-about__books" viewBox="0 0 300 150" role="img" aria-label="A stack of books: Maths, Physics, Chemistry, Big Dreams">
    <defs>
      <linearGradient id="about-book-a" x1="0" x2="1"><stop offset="0" stopColor="#8f6cf8" /><stop offset="1" stopColor="#6c3df4" /></linearGradient>
      <linearGradient id="about-book-b" x1="0" x2="1"><stop offset="0" stopColor="#f6c7e6" /><stop offset="1" stopColor="#e99ad0" /></linearGradient>
      <linearGradient id="about-book-c" x1="0" x2="1"><stop offset="0" stopColor="#c7b4ff" /><stop offset="1" stopColor="#a58bff" /></linearGradient>
    </defs>
    <g transform="rotate(-3 150 30)">
      <rect x="44" y="12" width="200" height="30" rx="7" fill="url(#about-book-c)" />
      <rect x="236" y="15" width="10" height="24" rx="3" fill="#fbf8ff" />
      <text x="136" y="33" textAnchor="middle">MATHS</text>
    </g>
    <g transform="rotate(2 150 64)">
      <rect x="30" y="47" width="224" height="30" rx="7" fill="url(#about-book-b)" />
      <rect x="246" y="50" width="10" height="24" rx="3" fill="#fbf8ff" />
      <text x="136" y="68" textAnchor="middle" className="ace-about__books-dark">PHYSICS · CHEMISTRY</text>
    </g>
    <rect x="18" y="84" width="258" height="44" rx="9" fill="url(#about-book-a)" />
    <rect x="266" y="89" width="12" height="34" rx="4" fill="#fbf8ff" />
    <path d="M36 92v28M250 92v28" stroke="#ffd35c" strokeWidth="3" />
    <text x="143" y="113" textAnchor="middle" className="ace-about__books-big">BIG DREAMS</text>
  </svg>
);

const HeroLaptop = () => (
  <svg className="ace-about__laptop" viewBox="0 0 170 120" aria-hidden="true">
    <defs>
      <linearGradient id="about-laptop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c9c0ec" /><stop offset="1" stopColor="#9b8fd0" /></linearGradient>
    </defs>
    <path d="M30 8h104c6 0 10 4 11 10l12 68H19l1-68c0-6 4-10 10-10z" fill="url(#about-laptop)" transform="skewX(-8) translate(12 0)" />
    <path d="M44 20h86c4 0 6 2 7 6l8 50H35l3-50c0-4 3-6 6-6z" fill="#efeaff" transform="skewX(-8) translate(12 0)" />
    <path d="M86 58c-8-5-13-9-13-15 0-4 3-7 7-7 3 0 5 2 6 4 1-2 3-4 6-4 4 0 7 3 7 7 0 6-5 10-13 15z" fill="#f07dc1" />
    <path d="M4 94h160c3 0 5 3 3 6l-7 9c-2 2-4 3-7 3H16c-3 0-5-1-7-3l-7-9c-2-3 0-6 2-6z" fill="#b3a8e2" />
  </svg>
);

const HeroCat = () => (
  <svg className="ace-about__cat" viewBox="0 0 170 110" aria-hidden="true">
    <rect x="6" y="80" width="150" height="24" rx="6" fill="#9f86f7" />
    <rect x="16" y="60" width="132" height="22" rx="6" fill="#f3c2df" />
    <path d="M40 60c-2-22 14-34 40-34 22 0 38 8 44 20l10-14 3 20c5 3 6 6 4 8H40z" fill="#fff9f1" stroke="#5f5378" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M52 34l6-16 10 12M88 28l10-14 4 16" fill="#fff9f1" stroke="#5f5378" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M60 44c3 2 6 2 9 0M84 44c3 2 6 2 9 0" stroke="#5f5378" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M122 58c14 2 22-6 18-16" stroke="#5f5378" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M100 46c8-4 14-4 20 2" stroke="#d9c6a8" strokeWidth="4" strokeLinecap="round" fill="none" />
    <text x="130" y="28" className="ace-about__cat-z">z</text>
    <text x="144" y="16" className="ace-about__cat-z">z</text>
  </svg>
);

const HeroBrainDoodle = () => (
  <svg className="ace-about__brain-doodle" viewBox="0 0 80 64" aria-hidden="true">
    <path d="M40 12c-4-7-15-7-18 0-7-1-12 6-9 12-6 3-6 12 0 15-2 7 5 13 12 11 3 6 12 7 15 1 3 6 12 5 15-1 7 2 14-4 12-11 6-3 6-12 0-15 3-6-2-13-9-12-3-7-14-7-18 0z" fill="#fff" stroke="#6f6598" strokeWidth="2" />
    <path d="M40 12v39M28 24c4 0 6 3 6 6M52 24c-4 0-6 3-6 6M24 38c3-2 7-1 9 2M56 38c-3-2-7-1-9 2" stroke="#6f6598" strokeWidth="2" fill="none" strokeLinecap="round" />
    <circle cx="33" cy="33" r="1.6" fill="#6f6598" /><circle cx="47" cy="33" r="1.6" fill="#6f6598" />
    <path d="M36 40c2 2 6 2 8 0" stroke="#6f6598" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

const LynaeHeart = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 150 100" aria-hidden="true">
    <defs>
      <radialGradient id="about-lynae-heart" cx="40%" cy="30%" r="75%">
        <stop offset="0" stopColor="#ffe3ef" />
        <stop offset=".55" stopColor="#ff9fc6" />
        <stop offset="1" stopColor="#ef6fa6" />
      </radialGradient>
      <linearGradient id="about-lynae-wing" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" />
        <stop offset="1" stopColor="#f8d9ea" />
      </linearGradient>
    </defs>
    <path d="M44 40C30 22 10 22 4 30c10 0 16 4 18 9-9-2-16 1-18 6 9-1 15 1 18 5-6 1-10 4-11 8 12-4 22-2 33-6z" fill="url(#about-lynae-wing)" stroke="#f3b6d5" strokeWidth="1.5" />
    <path d="M106 40c14-18 34-18 40-10-10 0-16 4-18 9 9-2 16 1 18 6-9-1-15 1-18 5 6 1 10 4 11 8-12-4-22-2-33-6z" fill="url(#about-lynae-wing)" stroke="#f3b6d5" strokeWidth="1.5" />
    <path d="M75 92C47 74 32 59 32 40c0-13 9-23 21-23 9 0 17 5 22 13 5-8 13-13 22-13 12 0 21 10 21 23 0 19-15 34-43 52z" fill="url(#about-lynae-heart)" />
    <ellipse cx="56" cy="34" rx="9" ry="5" fill="#fff" opacity=".65" transform="rotate(-25 56 34)" />
  </svg>
);

const Scribble = ({ className = '' }) => (
  <svg className={`ace-about__scribble ${className}`} viewBox="0 0 220 24" preserveAspectRatio="none" aria-hidden="true">
    <path d="M4 15c40-8 92-10 136-7 26 2 50 5 76 2" />
    <path d="M18 20c54-6 110-7 176-4" />
  </svg>
);

const AboutUsPage = () => {
  const [viewer, setViewer] = useState(-1);

  const closeViewer = useCallback(() => setViewer(-1), []);
  const stepViewer = useCallback((delta) => {
    setViewer((current) => (current < 0 ? current : (current + delta + GALLERY.length) % GALLERY.length));
  }, []);

  useEffect(() => {
    if (viewer < 0) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') closeViewer();
      if (event.key === 'ArrowRight') stepViewer(1);
      if (event.key === 'ArrowLeft') stepViewer(-1);
    };
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [viewer, closeViewer, stepViewer]);

  const active = viewer >= 0 ? GALLERY[viewer] : null;

  return (
    <div className="ace-about">
      <section className="ace-about__hero" aria-labelledby="about-title">
        <div className="ace-about__hero-copy">
          <p className="ace-about__eyebrow">About us</p>
          <h1 id="about-title">
            Meet <span className="ace-about__brand"><span className="ace-about__brand-text">ACEY</span><span className="ace-about__brand-dot" aria-hidden="true" /></span>
          </h1>
          <p className="ace-about__tagline">The little brain behind your biggest “aha!” moments.</p>
          <p className="ace-about__lead">
            ACEY is your AI learning companion — always curious, always patient, and always here to help you think deeper, not just faster.
          </p>
          <div className="ace-about__actions">
            <a href="#who-is-acey" className="ace-about__btn ace-about__btn--primary">Get to know ACEY <FaArrowDown aria-hidden="true" /></a>
            <a href="#acey-story" className="ace-about__btn ace-about__btn--ghost">Our story</a>
          </div>
          <p className="ace-about__hand ace-about__hand--hero">Curious minds.<br />Brighter futures. <Heart /></p>
        </div>

        <div className="ace-about__hero-art">
          <div className="ace-about__hero-glow" aria-hidden="true" />
          <Sparkle className="ace-about__deco ace-about__deco--s1" />
          <Star className="ace-about__deco ace-about__deco--s2" />
          <Sparkle className="ace-about__deco ace-about__deco--s3" />
          <Star className="ace-about__deco ace-about__deco--s4" />
          <Heart className="ace-about__deco ace-about__deco--h1" />
          <Heart className="ace-about__deco ace-about__deco--h2" />

          <div className="ace-about__bubble" aria-hidden="true">Hi!<br />I’m ACEY!</div>
          <div className="ace-about__note ace-about__note--kind" aria-hidden="true">
            A smarter,<br />kinder, more<br />curious you <Heart />
          </div>
          <ul className="ace-about__note ace-about__note--list" aria-label="What ACEY hopes for you">
            <li>More<br />Learning</li>
            <li>More<br />Confidence</li>
            <li>A Brighter<br />You</li>
          </ul>

          <HeroBrainDoodle />
          <HeroLaptop />
          <div className="ace-about__hero-stage">
            <img
              src="/about/acey-hoodie.webp"
              alt="ACEY, a purple lightbulb character with a brain for hair, round glasses and a cozy hoodie, waving hello"
              className="ace-about__hero-acey"
              width="792"
              height="1000"
            />
            <HeroBooks />
          </div>
          <HeroCat />
        </div>
      </section>

      <section className="ace-about__who" id="who-is-acey" aria-labelledby="who-title">
        <div className="ace-about__who-copy">
          <h2 id="who-title" className="ace-about__h2">
            But who is <span className="ace-about__marked">ACEY<Scribble /></span>?
          </h2>
          <p className="ace-about__who-lead">
            ACEY is more than a mascot — he’s a learning companion built around a simple idea: students learn better when they feel supported, not judged.
          </p>
          <p className="ace-about__body">
            His brain represents curiosity. His lightbulb body represents discovery. His glasses remind us to look closer. And his cheerful personality is here to cheer you on through every challenge.
          </p>
          <ul className="ace-about__traits">
            {TRAITS.map((trait) => (
              <li key={trait.id} className="ace-about__trait">
                <span className={`ace-about__trait-icon ace-about__trait-icon--${trait.tone}`}><TraitIcon id={trait.id} /></span>
                <strong>{trait.title}</strong>
                <span>{trait.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <figure className="ace-about__closer">
          <figcaption className="ace-about__closer-label">A closer look at ACEY</figcaption>
          <div className="ace-about__closer-stage">
            <img
              src="/about/acey-closeup.webp"
              alt="Close-up of ACEY: a pastel brain, big eyes behind round glasses, a smile and a lightbulb base"
              className="ace-about__closer-img"
              width="905"
              height="1000"
              loading="lazy"
            />
            <svg className="ace-about__closer-arrows" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path d="M19 24 C24 26 28 26 33 24" />
              <path d="M18 49 C24 50 28 48 34 45" />
              <path d="M22 76 C28 78 34 80 40 83" />
              <path d="M73 15 C68 16 64 18 60 21" />
              <path d="M81 44 C76 45 72 45 67 45" />
              <path d="M77 67 C72 66 67 63 63 59" />
            </svg>
            {CLOSER_LOOK.map((item) => (
              <span key={item.id} className="ace-about__callout" style={{ left: `${item.x}%`, top: `${item.y}%` }}>
                {item.text}
              </span>
            ))}
            <Star className="ace-about__closer-star" />
          </div>
          <p className="ace-about__hand ace-about__hand--closer">Same curiosity.<br />Bigger futures. <Heart /></p>
        </figure>
      </section>

      <section className="ace-about__story" id="acey-story" aria-labelledby="story-title">
        <div className="ace-about__story-head">
          <div>
            <h2 id="story-title" className="ace-about__h2">
              <span className="ace-about__marked ace-about__marked--pink">Before<Scribble /></span> ACEY had a name…
            </h2>
            <p className="ace-about__who-lead">
              ACEY started with a simple question: <em>what if studying felt a little less lonely?</em>
            </p>
            <p className="ace-about__body">
              The first idea wasn’t a polished AI tutor. It wasn’t even ACEY. It was a sketch — a small character that combined a brain, a lightbulb, and a little robot. Through many iterations, experiments, and late-night ideas, ACEY slowly came to life.
            </p>
          </div>
          <p className="ace-about__hand ace-about__hand--story">From a doodle<br />to a study buddy <Heart /></p>
        </div>

        <ol className="ace-about__steps">
          {STEPS.map((step, index) => (
            <li key={step.id} className={`ace-about__step ace-about__step--${step.id}`}>
              <div className="ace-about__step-media">
                <img src={step.image} alt={step.alt} width="768" height="400" loading="lazy" />
              </div>
              <div className="ace-about__step-text">
                <span className="ace-about__step-num">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="ace-about__sketchbook">
          <div className="ace-about__sketchbook-head">
            <h3>Peek inside the sketchbook</h3>
            <span>{GALLERY.length} frames from the real process · tap to enlarge</span>
          </div>
          <ul className="ace-about__filmstrip">
            {GALLERY.map((item, index) => (
              <li key={item.id}>
                <button type="button" onClick={() => setViewer(index)} aria-label={`Open: ${item.caption}`}>
                  <img src={item.thumb} alt="" width="360" height="270" loading="lazy" />
                  <span>{String(index + 1).padStart(2, '0')}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="ace-about__believe" aria-labelledby="believe-title">
        <div className="ace-about__believe-head">
          <h2 id="believe-title">What does ACEY believe?</h2>
          <p className="ace-about__believe-quote">
            We don’t want to make students dependent on AI.
            <span> We want to make them better at thinking without it.</span>
          </p>
        </div>
        <div className="ace-about__believe-side">
          <p className="ace-about__body">
            ACEY is designed to give you the right kind of support — hints, guided steps, and practice — so you can build your own understanding and confidence.
          </p>
          <ul className="ace-about__beliefs">
            {BELIEFS.map((belief) => (
              <li key={belief.id}>
                <span className="ace-about__belief-icon"><BeliefIcon id={belief.id} /></span>
                <strong>{belief.title}</strong>
                <span>{belief.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="ace-about__founder" aria-labelledby="founder-title">
        <div className="ace-about__founder-copy">
          <h2 id="founder-title" className="ace-about__h2">Meet the founder.</h2>
          <p className="ace-about__body">
            Hi! I’m Lyna Ai Do, a high school student, artist, and aspiring engineer. I created ACE AP STEM from my own experience with difficult STEM classes — the late nights, the frustration, and the moments of “I just don’t get it.”
          </p>
          <p className="ace-about__body">
            I wanted to build a tool that helps students move through those moments with stronger understanding, not just faster answers.
          </p>
          <a href="https://instagram.com/lynae_heartware" target="_blank" rel="noopener noreferrer" className="ace-about__btn ace-about__btn--primary">
            Follow my journey <FaArrowRight aria-hidden="true" />
          </a>
        </div>

        <div className="ace-about__founder-photo">
          <p className="ace-about__hand ace-about__hand--roles" aria-hidden="true">Student<br />Artist<br />Engineer<br />Builder <Heart /></p>
          <Star className="ace-about__founder-star ace-about__founder-star--a" />
          <Star className="ace-about__founder-star ace-about__founder-star--b" />
          <Sparkle className="ace-about__founder-star ace-about__founder-star--c" />
          <div className="ace-about__founder-frame">
            <img src="/about/founder.webp" alt="Lyna Ai Do, founder of ACE AP STEM" width="720" height="820" loading="lazy" />
          </div>
          <div className="ace-about__founder-tag">
            <strong>Lyna Ai Do</strong>
            <span>Founder of ACE AP STEM</span>
          </div>
        </div>

        <aside className="ace-about__lynae" aria-labelledby="lynae-title">
          <p className="ace-about__lynae-kicker">Also founded by Lyna</p>
          <p className="ace-about__hand ace-about__hand--lynae" aria-hidden="true">Same<br />belief.<br />Bigger<br />Impact. <Heart /></p>
          <div className="ace-about__lynae-logo">
            <LynaeHeart className="ace-about__lynae-mark" />
            <div>
              <h3 id="lynae-title">Lynae</h3>
              <span className="ace-about__lynae-name">Heart &amp; Hardware</span>
              <span className="ace-about__lynae-motto">Tools in hand, Kindness at Heart</span>
            </div>
          </div>
          <p className="ace-about__body">
            A nonprofit merging STEM education with social-emotional learning through 3D-printed therapeutic toys for children’s mental health.
          </p>
          <div className="ace-about__lynae-foot">
            <a href="https://lynae.org/" target="_blank" rel="noopener noreferrer" className="ace-about__btn ace-about__btn--soft">
              Visit Lynae Heart &amp; Hardware <FaArrowRight aria-hidden="true" />
            </a>
            <LynaeHeart className="ace-about__lynae-float" />
          </div>
        </aside>
      </section>

      <section className="ace-about__cta" aria-labelledby="cta-title">
        <div className="ace-about__cta-sky" aria-hidden="true">
          <Star className="ace-about__cta-star ace-about__cta-star--1" />
          <Star className="ace-about__cta-star ace-about__cta-star--2" />
          <Sparkle className="ace-about__cta-star ace-about__cta-star--3" />
          <Star className="ace-about__cta-star ace-about__cta-star--4" />
          <Sparkle className="ace-about__cta-star ace-about__cta-star--5" />
          <Star className="ace-about__cta-star ace-about__cta-star--6" />
        </div>
        <p className="ace-about__hand ace-about__hand--gotthis" aria-hidden="true">You<br />Got<br />This! <Heart /></p>
        <div className="ace-about__cta-acey" aria-hidden="true">
          <img src="/about/acey-wave-side.webp" alt="" width="820" height="1000" loading="lazy" />
          <svg className="ace-about__cta-book" viewBox="0 0 160 70">
            <path d="M80 18C62 6 34 4 8 10v52c26-6 54-4 72 8 18-12 46-14 72-8V10C126 4 98 6 80 18z" fill="#6c9cf5" />
            <path d="M80 22C63 11 38 9 14 14v42c24-4 48-2 66 8 18-10 42-12 66-8V14C122 9 97 11 80 22z" fill="#fbf7ff" />
            <path d="M80 22v42M26 24c14-2 28-1 42 4M26 34c14-2 28-1 42 4M92 28c14-5 28-6 42-4M92 38c14-5 28-6 42-4" stroke="#c9bdf2" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
          <div className="ace-about__cta-cloud" />
        </div>
        <div className="ace-about__cta-copy">
          <h2 id="cta-title">You bring the question.<br />ACEY helps you find the way.</h2>
          <p>Curious minds. Brighter futures.</p>
          <div className="ace-about__actions">
            <Link to="/solve-problems" className="ace-about__btn ace-about__btn--primary">
              Start learning with ACEY <FaArrowRight aria-hidden="true" />
            </Link>
            <a href="#acey-story" className="ace-about__btn ace-about__btn--outline">Our story</a>
          </div>
        </div>
        <p className="ace-about__hand ace-about__hand--big" aria-hidden="true">Big<br />Questions<br />Brighter<br />You <Heart /></p>
        <div className="ace-about__cta-clouds" aria-hidden="true" />
      </section>

      {active && (
        <div className="ace-about__viewer" role="dialog" aria-modal="true" aria-label={active.caption} onClick={closeViewer}>
          <div className="ace-about__viewer-card" onClick={(event) => event.stopPropagation()}>
            <img src={active.full} alt={active.caption} />
            <p>
              <span>{String(viewer + 1).padStart(2, '0')} / {GALLERY.length}</span>
              {active.caption}
            </p>
            <button type="button" className="ace-about__viewer-btn ace-about__viewer-btn--close" onClick={closeViewer} aria-label="Close" autoFocus>
              <FaTimes aria-hidden="true" />
            </button>
            <button type="button" className="ace-about__viewer-btn ace-about__viewer-btn--prev" onClick={() => stepViewer(-1)} aria-label="Previous image">
              <FaChevronLeft aria-hidden="true" />
            </button>
            <button type="button" className="ace-about__viewer-btn ace-about__viewer-btn--next" onClick={() => stepViewer(1)} aria-label="Next image">
              <FaChevronRight aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AboutUsPage;
