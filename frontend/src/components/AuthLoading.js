import React from 'react';
import Spinner from './primitives/Spinner';
import './AuthLoading.css';

const AuthLoading = () => {
  return (
    <div className="auth-loading">
      <div className="auth-loading-content">
        <div className="auth-loading-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <span className="logo-text">ACE AP STEM</span>
        </div>

        <div className="auth-loading-spinner">
          <Spinner size="large" color="primary" />
        </div>

        <div className="auth-loading-text">
          <h2>Checking Authentication</h2>
          <p>Please wait while we verify your session...</p>
        </div>

        <div className="auth-loading-progress">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLoading;
