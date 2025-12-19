import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authAPI } from '../utils/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Show toast for errors
  useEffect(() => {
    if (errors.general) {
      toast.error(errors.general, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    }
  }, [errors.general]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Simple validation
    if (!email) {
      setErrors({ email: 'Email is required' });
      setIsSubmitting(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      setIsSubmitting(false);
      return;
    }

    try {
      await authAPI.forgotPassword(email);
      setIsSuccess(true);
      toast.success('Check your email for the reset link!', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } catch (error) {
      setErrors({ general: error.message || 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <section className="signin-section">
        <div className="signin-container">
          <div className="signin-header">
            <h1>Check Your Email</h1>
            <p>We've sent a password reset link to <strong>{email}</strong></p>
          </div>

          <div className="signin-card">
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f97316"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginBottom: '1rem' }}
              >
                <rect width="20" height="16" x="2" y="4" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                The link will expire in 1 hour. If you don't see the email, check your spam folder.
              </p>
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setEmail('');
                }}
                className="btn-signup"
                style={{ marginBottom: '1rem' }}
              >
                Send Another Link
              </button>
            </div>

            <div className="signin-divider">
              <span>Or</span>
            </div>

            <Link to="/sign-in" className="btn-signin" style={{ textAlign: 'center', display: 'block' }}>
              Back to Sign In
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="signin-section">
      <div className="signin-container">
        <div className="signin-header">
          <h1>Forgot Password?</h1>
          <p>Enter your email and we'll send you a link to reset your password</p>
        </div>

        <div className="signin-card">
          <form onSubmit={handleSubmit} className="signin-form">
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={errors.email ? 'error' : ''}
                required
                autoComplete="email"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <button
              type="submit"
              className="btn-signin"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="signin-divider">
            <span>Remember your password?</span>
          </div>

          <Link to="/sign-in" className="btn-signup">
            Back to Sign In
          </Link>
        </div>

        <div className="signin-footer">
          <p>
            Need help? <Link to="/contact">Contact Support</Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default ForgotPasswordPage;
