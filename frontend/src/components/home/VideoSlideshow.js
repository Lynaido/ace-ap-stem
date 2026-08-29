import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './VideoSlideshow.css';

const VideoSlideshow = ({ videos, isPlaying, onIsPlayingChange, onSlideChange }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const videoRefs = useRef([]);
  const autoPlayTimerRef = useRef(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % videos.length);
    onIsPlayingChange(false);
  }, [videos.length, onIsPlayingChange]);

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
  }, [isPlaying, nextSlide]);

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
            <div
              className="video-wrapper"
              onClick={() => onIsPlayingChange(!isPlaying)}
            >
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                onEnded={nextSlide}
                preload="metadata"
                playsInline
              >
                <source src={video.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className={`video-overlay ${isPlaying && index === currentSlide ? 'playing' : ''}`}>
              </div>
              <div className="video-top-mask" aria-hidden="true" />
            </div>
          </div>
        ))}
      </div>

      {/* Side Arrows */}
      <button className="arrow-button prev" onClick={prevSlide} aria-label="Previous demo">
        <FaChevronLeft aria-hidden="true" />
      </button>
      <button className="arrow-button next" onClick={nextSlide} aria-label="Next demo">
        <FaChevronRight aria-hidden="true" />
      </button>

      {/* Bottom Navigation */}
      <div className="slideshow-nav">
        <button className="nav-button" onClick={prevSlide} aria-label="Previous demo">
          <FaChevronLeft aria-hidden="true" />
        </button>
        
        <div className="slide-indicators">
          {videos.map((_, index) => (
            <button
              type="button"
              key={index}
              className={`indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Show demo ${index + 1}`}
              aria-pressed={index === currentSlide}
            />
          ))}
        </div>
        
        <button className="nav-button" onClick={nextSlide} aria-label="Next demo">
          <FaChevronRight aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default VideoSlideshow;
