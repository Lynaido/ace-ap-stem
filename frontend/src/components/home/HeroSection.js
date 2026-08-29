import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaCheck, FaPause, FaPlay } from 'react-icons/fa';
import { useAppContext } from '../../context/AppContext';
import './HeroSection.css';
import VideoSlideshow from './VideoSlideshow';

const demoVideos = [
  {
    title: 'Upload Problem',
    url: '/videos/uploadProblem.mp4',
  },
  {
    title: 'Hint & Concept Note',
    url: '/videos/hintAndConceptNote.mp4',
  },
  {
    title: 'Study Mode',
    url: '/videos/studyMode.mp4',
  },
];

const HeroSection = () => {
  const { isAuthenticated } = useAppContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-content">
          <p className="hero-eyebrow">BUILT FOR AP STEM LEARNING</p>
          <h1 className="hero-title">Understand the exact part that has you stuck.</h1>
          <p className="hero-tagline">
            Upload a problem, choose the question or sub-part, and keep the solution, hints, and concept notes focused on the same learning goal.
          </p>
          <div className="hero-buttons">
            {isAuthenticated ? (
              <Link to="/solve-problems" className="btn btn-primary">Open your workspace <FaArrowRight /></Link>
            ) : (
              <Link to="/sign-up" className="btn btn-primary">Start learning <FaArrowRight /></Link>
            )}
            <a href="#how-it-works" className="hero-text-link">See how it works</a>
          </div>
          <ul className="hero-proof" aria-label="Product highlights">
            <li><FaCheck /> Question and sub-part selection</li>
            <li><FaCheck /> Connected hints, solutions, and notes</li>
            <li><FaCheck /> Saved learning history</li>
          </ul>
        </div>
        <div className="hero-mockup-wrapper">
          <div className="hero-demo-heading">
            <span>PRODUCT TOUR</span>
            <strong>{demoVideos[currentSlide].title}</strong>
          </div>
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
              {isPlaying ? <FaPause aria-hidden="true" /> : <FaPlay aria-hidden="true" />}
              {isPlaying ? 'Pause Demo' : 'Watch Demo'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
