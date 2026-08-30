import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaCheck, FaPause, FaPlay } from 'react-icons/fa';
import VideoSlideshow from './VideoSlideshow';
import './HowItWorks.css';

const demos = [
  { title: 'Upload a problem', url: '/videos/uploadProblem.mp4' },
  { title: 'Use hints and concept notes', url: '/videos/hintAndConceptNote.mp4' },
  { title: 'Turn it into study practice', url: '/videos/studyMode.mp4' },
];

const steps = [
  ['01', 'Bring your problem', 'Upload an image or type the question in your own words.'],
  ['02', 'Pick the exact target', 'Choose the whole question or one detected sub-part before ACE begins.'],
  ['03', 'Learn in one connected flow', 'Solution, hints and concept notes stay focused, then save together.'],
];

const HowItWorks = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeDemo, setActiveDemo] = useState(0);

  return (
    <section id="ace-demo" className="ace-demo" aria-labelledby="ace-demo-title">
      <div className="ace-demo__inner">
        <div className="ace-demo__media">
          <div className="ace-demo__window">
            <div className="ace-demo__bar" aria-hidden="true">
              <span /><span /><span />
              <strong>ACE product tour</strong>
            </div>
            <VideoSlideshow
              videos={demos}
              isPlaying={isPlaying}
              onIsPlayingChange={setIsPlaying}
              onSlideChange={setActiveDemo}
            />
          </div>
          <button className="ace-demo__play" type="button" onClick={() => setIsPlaying((value) => !value)}>
            {isPlaying ? <FaPause aria-hidden="true" /> : <FaPlay aria-hidden="true" />}
            <span>{isPlaying ? 'Pause tour' : 'Play tour'}</span>
          </button>
        </div>

        <div className="ace-demo__copy">
          <p className="ace-section-kicker">See ACE in action</p>
          <h2 id="ace-demo-title" className="ace-section-title">Less guessing. More <span className="ace-gradient-text">understanding.</span></h2>
          <p className="ace-demo__intro">The interface guides you from a crowded worksheet to one clear learning target.</p>

          <div className="ace-demo__steps">
            {steps.map(([number, title, text], index) => (
              <article key={number} className={index === activeDemo ? 'is-active' : ''}>
                <span>{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
                {index < activeDemo && <FaCheck aria-label="Completed" />}
              </article>
            ))}
          </div>

          <Link className="ace-demo__link" to="/solve-problems">
            Try the problem workflow <FaArrowRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
