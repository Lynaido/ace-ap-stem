import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './HeroSection.css';
import VideoSlideshow from './VideoSlideshow';

const demoVideos = [
  {
    title: 'Generate Solutions',
    url: '/videos/getSolution.mp4',
  },
  {
    title: 'Generate Hints & Concept Notes',
    url: '/videos/hintsAndConceptNotes.mp4',
  },
  {
    title: 'NotesHub & Study Variants',
    url: '/videos/notesVariant.mp4',
  },
];

const HeroSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title"><strong>Your AI-Powered AP STEM Companion</strong></h1>
          <p className="hero-tagline">
            Solve, explain, and organize AP STEM problems with ease. Learn smarter, stay organized, and strengthen your understanding with ACE AP STEM.
          </p>
          <div className="hero-buttons">
            <Link to="/sign-up" className="btn btn-primary">Sign Up Now</Link>
          </div>
        </div>
        <div className="hero-mockup-wrapper">
          <h2 className="video-section-title">{demoVideos[currentSlide].title}</h2>
          <div className="hero-mockup">
            <VideoSlideshow 
              videos={demoVideos} 
              isPlaying={isPlaying} 
              onIsPlayingChange={setIsPlaying} 
              onSlideChange={setCurrentSlide}
            />
          </div>
          <div className="watch-demo-container">
            <button className="btn-play" onClick={togglePlay}>
              {isPlaying ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ marginRight: '8px' }}>
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ marginRight: '8px' }}>
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
              {isPlaying ? 'Pause Demo' : 'Watch Demo'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
