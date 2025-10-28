import React, { useState, useEffect, useRef } from 'react';
import './VideoSlideshow.css';

const VideoSlideshow = ({ videos, isPlaying, onIsPlayingChange, onSlideChange }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const videoRefs = useRef([]);
  const autoPlayTimerRef = useRef(null);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % videos.length);
    onIsPlayingChange(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + videos.length) % videos.length);
    onIsPlayingChange(false);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    onIsPlayingChange(false);
  };

  useEffect(() => {
    const currentVideo = videoRefs.current[currentSlide];
    if (currentVideo) {
      if (isPlaying) {
        currentVideo.play();
      } else {
        currentVideo.pause();
      }
    }
  }, [isPlaying, currentSlide]);

  useEffect(() => {
    if (onSlideChange) {
      onSlideChange(currentSlide);
    }
  }, [currentSlide, onSlideChange]);

  // Auto-advance slideshow
  useEffect(() => {
    if (!isPlaying) {
      autoPlayTimerRef.current = setInterval(() => {
        nextSlide();
      }, 5000); // Change slide every 5 seconds
    }

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [currentSlide, isPlaying, nextSlide]);

  // Pause other videos when switching slides
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video && index !== currentSlide) {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [currentSlide]);

  return (
    <div className="video-slideshow-container">
      <div 
        className="video-slides-wrapper"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {videos.map((video, index) => (
          <div key={index} className="video-card">
            <div className="video-wrapper" onClick={() => onIsPlayingChange(!isPlaying)}>
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                onEnded={nextSlide}
                preload="metadata"
                playsInline
              >
                <source src={video.url} type="video/quicktime" />
                <source src={video.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className={`video-overlay ${isPlaying && index === currentSlide ? 'playing' : ''}`}>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Side Arrows */}
      <button className="arrow-button prev" onClick={prevSlide}>
        <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
      </button>
      <button className="arrow-button next" onClick={nextSlide}>
        <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
      </button>

      {/* Bottom Navigation */}
      <div className="slideshow-nav">
        <button className="nav-button" onClick={prevSlide}>
          <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        </button>
        
        <div className="slide-indicators">
          {videos.map((_, index) => (
            <div
              key={index}
              className={`indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
        
        <button className="nav-button" onClick={nextSlide}>
          <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
        </button>
      </div>
    </div>
  );
};

export default VideoSlideshow;
