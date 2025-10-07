import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './HeroSection.css';
import VideoSlideshow from './VideoSlideshow';

const demoVideos = [
  {
    title: 'Discover Features',
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  {
    title: 'Seamless Integration',
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  },
  {
    title: 'Boost Productivity',
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
];

const HeroSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title"><strong>Ace Your AP STEM Courses With Ease.</strong></h1>
          <p className="hero-tagline">
            Find, analyze, and organize academic papers with ease. Streamline your research, boost productivity, and gain insights faster with ScholarAI.
          </p>
          <div className="hero-buttons">
            <Link to="/sign-up" className="btn btn-primary">Sign Up Now</Link>
          </div>
          <div className="subject-badges">
            <span className="badge">AP Physics</span>
            <span className="badge">AP Calculus</span>
            <span className="badge">AP Chemistry</span>
            <span className="badge">AP Biology</span>
          </div>
        </div>
        <div className="hero-mockup-wrapper">
          <div className="hero-mockup">
            <VideoSlideshow videos={demoVideos} isPlaying={isPlaying} onIsPlayingChange={setIsPlaying} />
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
