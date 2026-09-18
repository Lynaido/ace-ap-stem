import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowDown, FaArrowRight, FaChevronDown, FaChevronLeft, FaChevronRight, FaExternalLinkAlt, FaInstagram, FaTimes, FaUser } from 'react-icons/fa';
import '@fontsource/caveat/600.css';
import AceyScene from '../components/home/AceyScene';
import AceyAvatar from '../components/acey/AceyAvatar';
import './AboutUsPage.css';

// Feet (x, y) and height (h) in % of /hero/about-scene.webp, measured from the
// camera that rendered it (tmp/hero-scene.html). The Original in the middle is
// the live 3D Acey, so it is not in this list (see HERO_LIVE_SLOT).
const HERO_CHARACTERS = [
  { id: 'classic', x: 18.64, y: 63.26, h: 22.62, depth: -0.6 },
  { id: 'long-vest', x: 41.2, y: 64.1, h: 18.11, depth: -3.6 },
  { id: 'graduation', x: 84.04, y: 54.11, h: 20.7, depth: -2.4 },
  { id: 'hoodie', x: 31.43, y: 71.34, h: 24.46, depth: 1.2 },
  { id: 'vest', x: 68.06, y: 69.87, h: 23.05, depth: 0.2 },
  { id: 'artist', x: 6.94, y: 79.29, h: 27.59, depth: 2.8 },
  { id: 'cloak', x: 93.14, y: 78.99, h: 26.64, depth: 2.6 },
].map((character) => ({ ...character, src: `/hero/acey-${character.id}.webp` }));

const HERO_SPARKLES = [
  { x: 31, y: 30, size: 14 },
  { x: 69, y: 26, size: 12, tone: 'pink' },
  { x: 60, y: 52, size: 10, tone: 'white' },
  { x: 17, y: 20, size: 11, tone: 'violet' },
  { x: 88, y: 24, size: 13 },
];

const HERO_APPEARANCE = { outfitId: 'original', moodId: 'cheerful', colorId: 'dreamy', accessoriesEnabled: true };

const TRAITS = [
  { id: 'curious', title: 'Curious', text: 'Always asking “what if?”', tone: 'violet' },
  { id: 'encouraging', title: 'Encouraging', text: 'Mistakes are part of learning.', tone: 'yellow' },
  { id: 'patient', title: 'Patient', text: 'Big problems become smaller steps.', tone: 'blue' },
  { id: 'student', title: 'Student-first', text: 'Technology should feel more human.', tone: 'pink' },
];

// Positions in the 1000×800 "closer look" stage. `to` is the part of Acey the
// arrow points at; `side` puts the card on the left or right.
const CLOSER_LOOK = [
  { id: 'brain', icon: 'brain', tone: 'violet', text: 'A brain\nfor curiosity', side: 'left', y: 15, path: 'M286 150 C330 140 362 160 392 190' },
  { id: 'eyes', icon: 'eye', tone: 'blue', text: 'Big eyes\nfor new perspectives', side: 'left', y: 44, path: 'M286 392 C340 402 392 400 438 388' },
  { id: 'bulb', icon: 'bulb', tone: 'yellow', text: 'A lightbulb\nfor bright ideas', side: 'left', y: 76, path: 'M286 646 C350 670 410 668 468 650' },
  { id: 'color', icon: 'palette', tone: 'orange', text: 'Colorful because\nlearning should be fun', side: 'right', y: 3, path: 'M714 70 C688 84 668 110 652 144' },
  { id: 'glasses', icon: 'glasses', tone: 'indigo', text: 'Glasses\nto look closer', side: 'right', y: 29, path: 'M842 294 C846 326 824 352 790 368' },
  { id: 'smile', icon: 'heart', tone: 'pink', text: 'A smile to remind\nyou you can do it', side: 'right', y: 62, path: 'M714 536 C660 560 604 548 562 512' },
];

const STEPS = [
  {
    id: 'logo',
    title: 'The Logo',
    text: 'It started with a simple symbol — a brain and a lightbulb, representing curiosity and discovery.',
    slides: [
      { src: '/about/process-sketch.webp', alt: 'Black and white logo sketches of a lightbulb with a brain and a robot face' },
      { src: '/about/gallery-sketch-paper-thumb.webp', full: '/about/gallery-sketch-paper.webp', alt: 'First paper sketches of the lightbulb character' },
      { src: '/about/gallery-logo-pair-thumb.webp', full: '/about/gallery-logo-pair.webp', alt: 'Choosing between a smiling face and a robot face' },
      { src: '/about/gallery-logo-moods-thumb.webp', full: '/about/gallery-logo-moods.webp', alt: 'Testing expressions: wink, wonder, curious, sleepy' },
    ],
  },
  {
    id: 'shape',
    title: 'Bringing It to Life',
    text: 'We turned the logo into a 3D model, exploring different shapes, proportions, and expressions.',
    slides: [
      { src: '/about/process-shape.webp', alt: 'Grey 3D sculpts of Acey in Blender and Maya' },
      { src: '/about/gallery-sculpt-blender-thumb.webp', full: '/about/gallery-sculpt-blender.webp', alt: 'First 3D sculpt with a simple rig' },
      { src: '/about/gallery-sculpt-maya-thumb.webp', full: '/about/gallery-sculpt-maya.webp', alt: 'Refining the sculpt: waving arm and friendly smile' },
      { src: '/about/gallery-color-first-thumb.webp', full: '/about/gallery-color-first.webp', alt: 'First colour pass in soft violet' },
    ],
  },
  {
    id: 'experiments',
    title: 'Exploring Possibilities',
    text: 'ACEY tried on many styles — scientist, wizard, artist, and more — until a personality truly felt right.',
    slides: [
      { src: '/about/process-experiments.webp', alt: 'A grey wizard sculpt of Acey next to coloured outfit versions' },
      { src: '/about/gallery-outfit-wizard-thumb.webp', full: '/about/gallery-outfit-wizard.webp', alt: 'Sculpting the wizard hat and robe' },
      { src: '/about/gallery-outfit-technician-thumb.webp', full: '/about/gallery-outfit-technician.webp', alt: 'Trying a technician outfit with a tool belt' },
      { src: '/about/gallery-outfit-texture-thumb.webp', full: '/about/gallery-outfit-texture.webp', alt: 'Painting textures for the outfits' },
    ],
  },
  {
    id: 'final',
    title: 'Meet ACEY',
    text: 'After many iterations, ACEY finally came to life — ready to learn, explore, and grow with you.',
    slides: [
      { src: '/about/gallery-color-soft.webp', alt: 'Pastel brain, rosy cheeks and a warm glow' },
    ],
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
  src: `/about/gallery-${id}-thumb.webp`,
  full: `/about/gallery-${id}.webp`,
  alt: caption,
}));

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

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

const Scribble = ({ className = '' }) => (
  <svg className={`ace-about__scribble ${className}`} viewBox="0 0 220 24" preserveAspectRatio="none" aria-hidden="true">
    <path d="M4 15c40-8 92-10 136-7 26 2 50 5 76 2" />
    <path d="M18 20c54-6 110-7 176-4" />
  </svg>
);

/* Sticker doodles around the founder portrait: a cheerful brain buddy, a
   winged heart and the little Lynae robot, drawn inline so they stay crisp. */
const CuteBrain = ({ className = '', wink = false }) => (
  <svg className={className} viewBox="0 0 120 108" aria-hidden="true">
    <defs>
      <linearGradient id="about-brain-fill" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f3e0ff" />
        <stop offset=".55" stopColor="#ddd0ff" />
        <stop offset="1" stopColor="#c9baff" />
      </linearGradient>
    </defs>
    <g fill="url(#about-brain-fill)" stroke="#8f7ce0" strokeWidth="2.4" strokeLinejoin="round">
      <circle cx="40" cy="30" r="17" />
      <circle cx="64" cy="22" r="15" />
      <circle cx="86" cy="34" r="16" />
      <circle cx="30" cy="50" r="15" />
      <circle cx="92" cy="56" r="14" />
      <circle cx="60" cy="44" r="20" />
    </g>
    <path d="M22 54c-4 16 6 34 26 39 7 2 15 2 22 0 20-5 30-23 26-39" fill="url(#about-brain-fill)" stroke="#8f7ce0" strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M22 56h78" stroke="#8f7ce0" strokeWidth="2.2" strokeLinecap="round" opacity=".55" />
    <g fill="#fff" stroke="#8f7ce0" strokeWidth="2.6">
      <circle cx="44" cy="72" r="15" />
      <circle cx="80" cy="72" r="15" />
    </g>
    <path d="M59 71c1.6-1.4 3.8-1.4 5.4 0" fill="none" stroke="#8f7ce0" strokeWidth="2.4" strokeLinecap="round" />
    {wink ? (
      <>
        <path d="M38 73c3-4 9-4 12 0" fill="none" stroke="#3f3374" strokeWidth="3.4" strokeLinecap="round" />
        <path d="M74 73c3-4 9-4 12 0" fill="none" stroke="#3f3374" strokeWidth="3.4" strokeLinecap="round" />
      </>
    ) : (
      <>
        <circle cx="44" cy="72" r="6.4" fill="#3f3374" />
        <circle cx="80" cy="72" r="6.4" fill="#3f3374" />
        <circle cx="46.4" cy="69.6" r="2.2" fill="#fff" />
        <circle cx="82.4" cy="69.6" r="2.2" fill="#fff" />
      </>
    )}
    <ellipse cx="30" cy="84" rx="6" ry="4" fill="#ffb4d4" opacity=".75" />
    <ellipse cx="94" cy="84" rx="6" ry="4" fill="#ffb4d4" opacity=".75" />
    <path d="M55 88c3.4 3.6 9.6 3.6 13 0" fill="none" stroke="#3f3374" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const CuteHeart = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 140 104" aria-hidden="true">
    <defs>
      <radialGradient id="about-cute-heart" cx="38%" cy="30%" r="76%">
        <stop offset="0" stopColor="#ffe6f1" />
        <stop offset=".55" stopColor="#ffb0d0" />
        <stop offset="1" stopColor="#f588b6" />
      </radialGradient>
    </defs>
    <path d="M40 40C27 24 10 25 5 33c9 0 14 4 16 9-8-2-14 1-16 6 8-1 13 1 16 5-5 1-9 4-10 8 11-4 20-3 30-7z" fill="#fff" stroke="#f3a9cd" strokeWidth="2" strokeLinejoin="round" />
    <path d="M100 40c13-16 30-15 35-7-9 0-14 4-16 9 8-2 14 1 16 6-8-1-13 1-16 5 5 1 9 4 10 8-11-4-20-3-30-7z" fill="#fff" stroke="#f3a9cd" strokeWidth="2" strokeLinejoin="round" />
    <path d="M70 96C47 79 34 66 34 50c0-11 8-19 18-19 7 0 14 4 18 11 4-7 11-11 18-11 10 0 18 8 18 19 0 16-13 29-36 46z" fill="url(#about-cute-heart)" stroke="#ef86b6" strokeWidth="2.4" strokeLinejoin="round" />
    <circle cx="58" cy="55" r="3.6" fill="#8a3f66" />
    <circle cx="82" cy="55" r="3.6" fill="#8a3f66" />
    <path d="M64 63c3 3 9 3 12 0" fill="none" stroke="#8a3f66" strokeWidth="2.6" strokeLinecap="round" />
    <ellipse cx="50" cy="62" rx="5" ry="3.4" fill="#ff8ab8" opacity=".6" />
    <ellipse cx="90" cy="62" rx="5" ry="3.4" fill="#ff8ab8" opacity=".6" />
  </svg>
);

const CuteRobot = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
    <defs>
      <linearGradient id="about-robot-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#dff0ff" />
        <stop offset="1" stopColor="#a9d4f5" />
      </linearGradient>
    </defs>
    <path d="M60 20v-8" stroke="#8fb9dd" strokeWidth="3.4" strokeLinecap="round" />
    <circle cx="60" cy="9" r="5" fill="#ffd45e" stroke="#e2ae2f" strokeWidth="2" />
    <rect x="20" y="20" width="80" height="62" rx="24" fill="url(#about-robot-body)" stroke="#7fb0da" strokeWidth="2.6" />
    <rect x="31" y="34" width="58" height="34" rx="16" fill="#f4fbff" stroke="#7fb0da" strokeWidth="2.2" />
    <circle cx="48" cy="50" r="5.4" fill="#3f5a78" />
    <circle cx="72" cy="50" r="5.4" fill="#3f5a78" />
    <path d="M55 59c2.6 2.6 7.4 2.6 10 0" fill="none" stroke="#3f5a78" strokeWidth="2.6" strokeLinecap="round" />
    <ellipse cx="38" cy="58" rx="4.6" ry="3" fill="#ffaecd" opacity=".8" />
    <ellipse cx="82" cy="58" rx="4.6" ry="3" fill="#ffaecd" opacity=".8" />
    <rect x="8" y="42" width="12" height="22" rx="6" fill="#c3e3fa" stroke="#7fb0da" strokeWidth="2.2" />
    <rect x="100" y="42" width="12" height="22" rx="6" fill="#c3e3fa" stroke="#7fb0da" strokeWidth="2.2" />
    <rect x="34" y="82" width="52" height="26" rx="13" fill="url(#about-robot-body)" stroke="#7fb0da" strokeWidth="2.6" />
    <path d="M60 104c-9-6-14-11-14-17 0-4 3-7 7-7 3 0 5.6 1.6 7 4 1.4-2.4 4-4 7-4 4 0 7 3 7 7 0 6-5 11-14 17z" fill="#ffb0d0" stroke="#ef86b6" strokeWidth="2.2" strokeLinejoin="round" />
  </svg>
);

const Twinkle = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
    <g stroke="#ffc94a" strokeWidth="3.4" strokeLinecap="round">
      <path d="M20 6v9M31 12l-6 6M9 12l6 6M20 34v-8" />
    </g>
  </svg>
);

const LynaeWordmark = () => (
  <svg className="ace-about__lynae-word" viewBox="0 0 120 34" aria-hidden="true">
    <text x="60" y="26" textAnchor="middle">LYNAE</text>
  </svg>
);

const CalloutIcon = ({ name }) => {
  const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  if (name === 'brain') return <svg {...common}><path d="M12 5c-1-2-4.5-2.2-5.6-.2C4.6 4.6 3.2 6.3 4 8c-1.7.9-1.9 3.6-.2 4.7-.6 2 1.1 4 3.3 3.5.8 1.9 3.6 2.2 4.9.6V5z" /><path d="M12 5c1-2 4.5-2.2 5.6-.2 1.8-.2 3.2 1.5 2.4 3.2 1.7.9 1.9 3.6.2 4.7.6 2-1.1 4-3.3 3.5-.8 1.9-3.6 2.2-4.9.6" /></svg>;
  if (name === 'eye') return <svg {...common}><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" /><circle cx="12" cy="12" r="3.2" /></svg>;
  if (name === 'bulb') return <svg {...common}><path d="M12 3a6 6 0 00-3.6 10.8c.8.6 1.1 1.3 1.1 2.2h5c0-.9.3-1.6 1.1-2.2A6 6 0 0012 3z" /><path d="M9.5 19h5M10.5 21.5h3" /></svg>;
  if (name === 'palette') return <svg {...common}><path d="M12 3a9 9 0 100 18c1.3 0 2-.9 2-1.9 0-1.3-1.2-1.6-1.2-2.8 0-1 .8-1.8 1.8-1.8H17a4 4 0 004-4C21 6.4 17 3 12 3z" /><circle cx="7.5" cy="11" r="1.2" /><circle cx="10" cy="7" r="1.2" /><circle cx="14.5" cy="7" r="1.2" /></svg>;
  if (name === 'glasses') return <svg {...common}><circle cx="6.5" cy="13" r="3.8" /><circle cx="17.5" cy="13" r="3.8" /><path d="M10.3 12.4c1.1-.8 2.3-.8 3.4 0M2.7 12L1.5 9M21.3 12l1.2-3" /></svg>;
  return <svg {...common}><path d="M12 20C6.5 16.2 3 12.9 3 8.7 3 6 5 4 7.6 4c1.8 0 3.4 1 4.4 2.5C13 5 14.6 4 16.4 4 19 4 21 6 21 8.7c0 4.2-3.5 7.5-9 11.3z" /></svg>;
};

const SketchBookIcon = () => (
  <svg className="ace-about__book-icon" viewBox="0 0 64 64" aria-hidden="true">
    <defs>
      <linearGradient id="about-book-cover" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#b18cff" /><stop offset="1" stopColor="#7a4cf2" /></linearGradient>
    </defs>
    <path d="M14 10h36a6 6 0 016 6v34a6 6 0 01-6 6H14z" fill="#e9dcff" transform="translate(2 2)" />
    <path d="M10 8h36a6 6 0 016 6v34a6 6 0 01-6 6H10z" fill="url(#about-book-cover)" />
    <path d="M10 8h6v46h-6z" fill="#6337d8" />
    <path d="M33 41c-6.5-4.2-10-7.8-10-12 0-3 2.3-5.2 5-5.2 2 0 3.8 1.1 5 2.8 1.2-1.7 3-2.8 5-2.8 2.7 0 5 2.2 5 5.2 0 4.2-3.5 7.8-10 12z" fill="#ffc2e2" />
  </svg>
);

// One process card: an image carousel with side arrows, swipe and dots. It
// auto-advances gently while visible and pauses on hover, focus or touch.
const StepCarousel = ({ step, index, onOpen }) => {
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef(null);
  const dragRef = useRef(null);
  const count = step.slides.length;
  const go = useCallback((delta) => setSlide((current) => (current + delta + count) % count), [count]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver !== 'function') return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || paused || prefersReducedMotion()) return undefined;
    // Staggered so the four cards never flip at the same moment.
    const timer = window.setTimeout(() => go(1), 4200 + index * 650);
    return () => window.clearTimeout(timer);
  }, [visible, paused, slide, index, go]);

  const onPointerDown = (event) => { dragRef.current = { x: event.clientX, moved: false }; };
  const onPointerUp = (event) => {
    const start = dragRef.current;
    dragRef.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    else onOpen(step.slides, slide);
  };

  return (
    <li
      ref={rootRef}
      className={`ace-about__step ace-about__step--${step.id}`}
      data-reveal
      style={{ '--reveal-delay': `${index * 120}ms` }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="ace-about__step-media" aria-roledescription="carousel" aria-label={`${step.title} images`}>
        <div
          className="ace-about__step-track"
          style={{ transform: `translateX(-${slide * 100}%)` }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => { dragRef.current = null; }}
        >
          {step.slides.map((item, slideIndex) => (
            <div
              key={item.src}
              className={`ace-about__step-slide${item.fit === 'contain' ? ' ace-about__step-slide--contain' : ''}`}
              aria-hidden={slideIndex !== slide}
              role="group"
              aria-label={`${slideIndex + 1} of ${count}`}
            >
              <img src={item.src} alt={item.alt} loading="lazy" draggable="false" />
            </div>
          ))}
        </div>
        {count > 1 && (
          <>
            <button type="button" className="ace-about__step-arrow ace-about__step-arrow--prev" onClick={() => go(-1)} aria-label={`Previous ${step.title} image`}>
              <FaChevronLeft aria-hidden="true" />
            </button>
            <button type="button" className="ace-about__step-arrow ace-about__step-arrow--next" onClick={() => go(1)} aria-label={`Next ${step.title} image`}>
              <FaChevronRight aria-hidden="true" />
            </button>
          </>
        )}
      </div>
      <div className="ace-about__step-text">
        <div className="ace-about__step-title">
          <span className="ace-about__step-num">{String(index + 1).padStart(2, '0')}</span>
          <h3>{step.title}</h3>
        </div>
        <p>{step.text}</p>
        <div className="ace-about__dots">
          {count > 1 && step.slides.map((item, slideIndex) => (
            <button
              key={item.src}
              type="button"
              className={slideIndex === slide ? 'is-active' : ''}
              onClick={() => setSlide(slideIndex)}
              aria-label={`Show image ${slideIndex + 1} of ${count}`}
              aria-current={slideIndex === slide}
            >
              {slideIndex === slide && !paused && visible && <i key={slide} style={{ animationDuration: `${4200 + index * 650}ms` }} />}
            </button>
          ))}
        </div>
      </div>
    </li>
  );
};

const Sketchbook = ({ onOpen }) => {
  const stripRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const strip = stripRef.current;
    if (!strip) return;
    setEdges({ start: strip.scrollLeft < 8, end: strip.scrollLeft + strip.clientWidth > strip.scrollWidth - 8 });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  const page = (direction) => {
    const strip = stripRef.current;
    if (!strip) return;
    strip.scrollBy({ left: direction * strip.clientWidth * 0.8, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  return (
    <div className="ace-about__sketchbook" data-reveal>
      <div className="ace-about__sketchbook-head">
        <SketchBookIcon />
        <div className="ace-about__sketchbook-title">
          <h3>A peek inside the sketchbook</h3>
          <p>Early ideas, rough drafts, and little details that shaped ACEY.</p>
        </div>
        <span className="ace-about__sketchbook-count">{GALLERY.length}+ sketches from the real process</span>
        <div className="ace-about__sketchbook-nav">
          <button type="button" onClick={() => page(-1)} disabled={edges.start} aria-label="Scroll sketches back"><FaChevronLeft aria-hidden="true" /></button>
          <button type="button" onClick={() => page(1)} disabled={edges.end} aria-label="Scroll sketches forward"><FaChevronRight aria-hidden="true" /></button>
        </div>
      </div>
      <ul className="ace-about__filmstrip" ref={stripRef} onScroll={measure}>
        {GALLERY.map((item, index) => (
          <li key={item.id}>
            <button type="button" onClick={() => onOpen(GALLERY, index)} aria-label={`Open: ${item.caption}`}>
              <img src={item.src} alt="" width="360" height="270" loading="lazy" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Hero: the study room with every role, and the real 3D Acey in the middle
// waving. Clicking Acey (or hovering the stage) says hello again.
const AboutHero = () => {
  const [reaction, setReaction] = useState(null);
  const [greeting, setGreeting] = useState(false);
  const hello = () => {
    setReaction({ id: 'hello', key: Date.now() });
    setGreeting(true);
  };

  useEffect(() => {
    if (!greeting) return undefined;
    const timer = window.setTimeout(() => setGreeting(false), 2600);
    return () => window.clearTimeout(timer);
  }, [greeting, reaction]);

  return (
    <section className="ace-about__hero" aria-labelledby="about-title">
      <AceyScene
        className="ace-about__hero-scene"
        scene={{ large: '/hero/about-scene.webp', small: '/hero/about-scene-sm.webp' }}
        over="/hero/about-over.webp"
        characters={HERO_CHARACTERS}
        sparkles={HERO_SPARKLES}
        veil
      >
        <button type="button" className="ace-about__live-acey" onClick={hello} aria-label="Say hi to ACEY">
          <img className="ace-about__live-fallback" src="/hero/acey-original.webp" alt="" />
          <AceyAvatar appearance={HERO_APPEARANCE} reaction={reaction} compact={false} />
          <span className={`ace-about__hi${greeting ? ' is-on' : ''}`}>Hi! I’m ACEY! <Heart /></span>
        </button>
      </AceyScene>
      <div className="ace-about__hero-veil" aria-hidden="true" />

      <div className="ace-about__hero-copy">
        <p className="ace-about__eyebrow ace-about__rise" style={{ '--i': 0 }}>About us</p>
        <h1 id="about-title" className="ace-about__rise" style={{ '--i': 1 }}>
          Meet <span className="ace-about__brand">ACEY</span><span className="ace-about__brand-dot" aria-hidden="true">.</span>
        </h1>
        <p className="ace-about__tagline ace-about__rise" style={{ '--i': 2 }}>A smarter, kinder, more curious you.</p>
        <p className="ace-about__lead ace-about__rise" style={{ '--i': 3 }}>
          <strong>ACEY</strong> is the heart of ACE AP STEM — your AI study buddy, motivator, and cheerleader through every challenge.
        </p>
        <div className="ace-about__actions ace-about__rise" style={{ '--i': 4 }}>
          <a href="#acey-story" className="ace-about__btn ace-about__btn--primary">Our Story <FaArrowRight aria-hidden="true" /></a>
          <a href="#meet-founder" className="ace-about__btn ace-about__btn--ghost">Meet the Founder <FaArrowDown aria-hidden="true" /></a>
        </div>
      </div>

      <a href="#meet-founder" className="ace-about__hero-cue">
        <span aria-hidden="true"><FaChevronDown /></span>
        Meet the Founder
      </a>
    </section>
  );
};

const AboutUsPage = () => {
  const [viewer, setViewer] = useState(null);
  const pageRef = useRef(null);

  const openViewer = useCallback((items, index) => setViewer({ items, index }), []);
  const closeViewer = useCallback(() => setViewer(null), []);
  const stepViewer = useCallback((delta) => {
    setViewer((current) => (current ? { ...current, index: (current.index + delta + current.items.length) % current.items.length } : current));
  }, []);

  useEffect(() => {
    if (!viewer) return undefined;
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

  // Sections ease in as they scroll into view.
  useEffect(() => {
    const nodes = pageRef.current?.querySelectorAll('[data-reveal]') || [];
    if (typeof IntersectionObserver !== 'function' || prefersReducedMotion()) {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -8% 0px' });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const active = viewer ? viewer.items[viewer.index] : null;

  return (
    <div className="ace-about" ref={pageRef}>
      <AboutHero />

      <section className="ace-about__who" id="who-is-acey" aria-labelledby="who-title">
        <div className="ace-about__who-copy" data-reveal>
          <p className="ace-about__eyebrow">About ACEY</p>
          <h2 id="who-title" className="ace-about__display">
            But who is<br /><span className="ace-about__marked"><span className="ace-about__gradient">ACEY</span><Scribble /></span>?
          </h2>
          <p className="ace-about__who-lead">
            ACEY is a learning companion built around a simple idea: students learn better when they feel supported, not judged. ACEY is here to make every question less intimidating and every step forward a little more joyful.
          </p>
          <ul className="ace-about__traits">
            {TRAITS.map((trait, index) => (
              <li key={trait.id} className={`ace-about__trait ace-about__trait--${trait.tone}`} style={{ '--reveal-delay': `${200 + index * 110}ms` }}>
                <span className="ace-about__trait-icon"><TraitIcon id={trait.id} /></span>
                <strong>{trait.title}</strong>
                <span>{trait.text}</span>
                <i aria-hidden="true" />
              </li>
            ))}
          </ul>
          <a href="#acey-story" className="ace-about__btn ace-about__btn--primary ace-about__who-btn">Our Story <FaArrowRight aria-hidden="true" /></a>
        </div>

        <figure className="ace-about__closer" data-reveal>
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
            <svg className="ace-about__closer-arrows" viewBox="0 0 1000 800" aria-hidden="true">
              <defs>
                <marker id="about-arrowhead" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M1 1l7 4-7 4" fill="none" stroke="#7a5cf0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </marker>
              </defs>
              {CLOSER_LOOK.map((item, index) => (
                <path key={item.id} d={item.path} pathLength="1" markerEnd="url(#about-arrowhead)" style={{ '--reveal-delay': `${500 + index * 140}ms` }} />
              ))}
            </svg>
            {CLOSER_LOOK.map((item, index) => (
              <span
                key={item.id}
                className={`ace-about__callout ace-about__callout--${item.side} ace-about__callout--${item.tone}`}
                style={{ top: `${item.y}%`, '--reveal-delay': `${400 + index * 140}ms` }}
              >
                <span className="ace-about__callout-icon"><CalloutIcon name={item.icon} /></span>
                <span className="ace-about__callout-text">{item.text}</span>
              </span>
            ))}
          </div>
        </figure>
      </section>

      <section className="ace-about__story" id="acey-story" aria-labelledby="story-title">
        <div className="ace-about__story-head" data-reveal>
          <div className="ace-about__story-copy">
            <p className="ace-about__eyebrow">Our process</p>
            <h2 id="story-title" className="ace-about__display ace-about__display--story">
              From a logo<br />
              <span className="ace-about__gradient ace-about__gradient--cool">to a learning </span>
              <span className="ace-about__marked ace-about__marked--pink"><span className="ace-about__gradient ace-about__gradient--pink">buddy</span><Scribble /></span>.
            </h2>
            <p className="ace-about__story-lead">
              ACEY started with a simple idea: what if studying felt a little less lonely? It began as a logo — a lightbulb and a brain. Through countless sketches, experiments, and late-night ideas, that logo slowly came to life as ACEY.
            </p>
          </div>
          <div className="ace-about__story-acey" aria-hidden="true">
            <svg className="ace-about__wave-lines" viewBox="0 0 60 60">
              <path d="M40 8c-8 2-14 7-17 14M50 20c-8 1-13 5-16 11M46 36c-5 0-9 2-12 5" />
            </svg>
            <img src="/about/acey-wave-hello.webp" alt="" width="646" height="720" loading="lazy" />
          </div>
        </div>

        <ol className="ace-about__steps">
          {STEPS.map((step, index) => (
            <StepCarousel key={step.id} step={step} index={index} onOpen={openViewer} />
          ))}
        </ol>

        <Sketchbook onOpen={openViewer} />
      </section>

      <section className="ace-about__founder" id="meet-founder" aria-labelledby="founder-title" data-reveal>
        <div className="ace-about__founder-copy">
          <p className="ace-about__founder-badge"><FaUser aria-hidden="true" /> Meet the founder</p>
          <h2 id="founder-title" className="ace-about__display ace-about__founder-title">
            Meet the<br /><span className="ace-about__gradient">founder.</span><Heart className="ace-about__founder-title-heart" />
          </h2>
          <p className="ace-about__body"><strong>Hi! I’m Lyna Ai Do,</strong> a high school student, artist, and aspiring engineer.</p>
          <p className="ace-about__body">
            I created ACE AP STEM from my own experience with difficult STEM classes — the late nights, the frustration, and the moments of “I just don’t get it.”
          </p>
          <p className="ace-about__body">
            I wanted to build a tool that helps students move through those moments with stronger understanding, not just faster answers.
          </p>
          <a href="https://instagram.com/lynae_heartware" target="_blank" rel="noopener noreferrer" className="ace-about__btn ace-about__btn--primary">
            Follow my journey <FaArrowRight aria-hidden="true" />
          </a>
        </div>

        <div className="ace-about__founder-photo">
          <div className="ace-about__founder-frame">
            <img src="/about/founder-lyna.webp" alt="Lyna Ai Do, founder of ACE AP STEM" width="720" height="818" loading="lazy" />
          </div>
          {/* Hand-drawn stickers around the portrait, as in the client's design. */}
          <CuteBrain className="ace-about__sticker ace-about__sticker--brain-a" />
          <CuteBrain className="ace-about__sticker ace-about__sticker--brain-b" wink />
          <CuteHeart className="ace-about__sticker ace-about__sticker--heart-a" />
          <CuteHeart className="ace-about__sticker ace-about__sticker--heart-b" />
          <CuteRobot className="ace-about__sticker ace-about__sticker--robot" />
          <Twinkle className="ace-about__sticker ace-about__sticker--twinkle-a" />
          <Twinkle className="ace-about__sticker ace-about__sticker--twinkle-b" />
          <Twinkle className="ace-about__sticker ace-about__sticker--twinkle-c" />
          <Heart className="ace-about__sticker ace-about__sticker--outline-a" />
          <Heart className="ace-about__sticker ace-about__sticker--outline-b" />
          <div className="ace-about__founder-tag">
            <div>
              <strong>Lyna Ai Do</strong>
              <span>Founder of ACE AP STEM</span>
            </div>
            <Heart />
          </div>
        </div>

        <aside className="ace-about__lynae" aria-labelledby="lynae-title">
          <p className="ace-about__lynae-kicker">Also founded by Lyna <Heart /></p>
          <div className="ace-about__lynae-logo">
            <span className="ace-about__lynae-mark">
              <LynaeWordmark />
              <CuteRobot className="ace-about__lynae-robot" />
              <CuteHeart className="ace-about__lynae-heart" />
            </span>
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
              <FaExternalLinkAlt aria-hidden="true" /> Visit Website <FaArrowRight aria-hidden="true" />
            </a>
            <a href="https://instagram.com/lynae_heartware" target="_blank" rel="noopener noreferrer" className="ace-about__btn ace-about__btn--soft">
              <FaInstagram aria-hidden="true" /> Instagram <FaArrowRight aria-hidden="true" />
            </a>
          </div>
          <CuteHeart className="ace-about__sticker ace-about__sticker--lynae" />
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
        <div className="ace-about__viewer" role="dialog" aria-modal="true" aria-label={active.caption || active.alt} onClick={closeViewer}>
          <div className="ace-about__viewer-card" onClick={(event) => event.stopPropagation()}>
            <img key={active.full || active.src} src={active.full || active.src} alt={active.caption || active.alt} />
            <p>
              <span>{String(viewer.index + 1).padStart(2, '0')} / {viewer.items.length}</span>
              {active.caption || active.alt}
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
