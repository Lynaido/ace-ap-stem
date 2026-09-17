import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './VideoSlideshow.css';

// The demo recordings are 2:1 frames with dark bars on both sides, a dark
// strip at the top and, in one video, at the bottom. Only this part of each
// frame (fractions of the video picture) is shown, as a rounded window.
export const VIDEO_WINDOW = { left: 0.1215, right: 0.1215, top: 0.1025, bottom: 0.025 };

// Where that window sits inside a wrapper, for a video drawn with
// object-fit: contain (letterboxed on whichever side has room).
export const getVideoWindow = (wrapperWidth, wrapperHeight, videoWidth, videoHeight) => {
  if (!wrapperWidth || !wrapperHeight || !videoWidth || !videoHeight) return null;
  const scale = Math.min(wrapperWidth / videoWidth, wrapperHeight / videoHeight);
  const width = videoWidth * scale;
  const height = videoHeight * scale;
  const x = (wrapperWidth - width) / 2;
  const y = (wrapperHeight - height) / 2;
  return {
    left: x + (width * VIDEO_WINDOW.left),
    top: y + (height * VIDEO_WINDOW.top),
    width: width * (1 - VIDEO_WINDOW.left - VIDEO_WINDOW.right),
    height: height * (1 - VIDEO_WINDOW.top - VIDEO_WINDOW.bottom),
  };
};

const VideoSlideshow = ({ videos, isPlaying, onIsPlayingChange, onSlideChange }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const videoRefs = useRef([]);
  const autoPlayTimerRef = useRef(null);
  const [videoWindow, setVideoWindow] = useState(null);

  // Keep the rounded window on the visible picture as the layout resizes.
  const measureWindow = useCallback(() => {
    const video = videoRefs.current.find((item) => item?.videoWidth);
    const wrapper = video?.parentElement;
    if (!video || !wrapper) return;
    const next = getVideoWindow(wrapper.clientWidth, wrapper.clientHeight, video.videoWidth, video.videoHeight);
    if (next) setVideoWindow(next);
  }, []);

  useEffect(() => {
    measureWindow();
    const wrapper = videoRefs.current[0]?.parentElement;
    if (!wrapper || typeof ResizeObserver !== 'function') return undefined;
    const observer = new ResizeObserver(measureWindow);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [measureWindow]);

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
                onLoadedMetadata={measureWindow}
                preload="metadata"
                playsInline
              >
                <source src={video.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className={`video-overlay ${isPlaying && index === currentSlide ? 'playing' : ''}`}>
              </div>
              <div
                className="video-window"
                aria-hidden="true"
                style={videoWindow ? {
                  left: `${videoWindow.left}px`,
                  top: `${videoWindow.top}px`,
                  width: `${videoWindow.width}px`,
                  height: `${videoWindow.height}px`,
                } : undefined}
              />
            </div>
          </div>
        ))}
      </div>

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
