import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authAPI } from '../utils/api';
import { FaArrowRight, FaCheckCircle, FaEnvelopeOpenText } from 'react-icons/fa';
import './AuthPages.css';

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
      <section className="ace-auth" aria-labelledby="forgot-success-title">
        <div className="ace-auth__shell">
          <AuthStory />
          <div className="ace-auth__content">
            <div className="ace-auth__content-inner">
              <header className="ace-auth__header">
                <h1 id="forgot-success-title">Check your email</h1>
                <p>We sent a password reset link to <strong>{email}</strong>.</p>
              </header>
              <div className="ace-auth__success-panel" role="status">
                <FaEnvelopeOpenText aria-hidden="true" />
                <p>The link expires in 1 hour. Check your spam folder if it does not appear.</p>
                <div className="ace-auth__success-actions">
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setEmail('');
                }}
                    className="ace-auth__secondary"
              >
                Send Another Link
              </button>
                  <Link to="/sign-in" className="ace-auth__primary">Back to sign in <FaArrowRight aria-hidden="true" /></Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="ace-auth" aria-labelledby="forgot-title">
      <div className="ace-auth__shell">
        <AuthStory />
        <div className="ace-auth__content">
          <div className="ace-auth__content-inner">
            <header className="ace-auth__header">
              <h1 id="forgot-title">Reset your password</h1>
              <p>Enter your email and we will send you a secure reset link.</p>
            </header>
            {errors.general && <div className="ace-auth__error-banner" role="alert">{errors.general}</div>}
            <form onSubmit={handleSubmit} className="ace-auth__form" noValidate>
              <div className="ace-auth__field">
                <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'forgot-email-error' : undefined}
                required
                autoComplete="email"
              />
                {errors.email && <span className="ace-auth__field-error" id="forgot-email-error">{errors.email}</span>}
            </div>

            <button
              type="submit"
                className="ace-auth__primary"
              disabled={isSubmitting}
            >
                {isSubmitting ? 'Sending...' : <><span>Send reset link</span><FaArrowRight aria-hidden="true" /></>}
            </button>
          </form>

            <div className="ace-auth__divider">
            <span>Remember your password?</span>
          </div>

            <Link to="/sign-in" className="ace-auth__secondary">
            Back to Sign In
          </Link>

            <p className="ace-auth__legal">
            Need help? <Link to="/contact">Contact Support</Link>
          </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const AuthStory = () => (
  <aside className="ace-auth__story">
    <Link to="/" className="ace-auth__brand" aria-label="ACE AP STEM home">
      <img src="/logo.png" alt="" width="40" height="40" />
      <span>ACE AP STEM</span>
    </Link>
    <div className="ace-auth__story-copy">
      <span>Account access</span>
      <h2>Get back to learning with confidence.</h2>
      <p>We will help you restore access without losing your study momentum.</p>
    </div>
    <ul className="ace-auth__benefits">
      <li><FaCheckCircle aria-hidden="true" /> Secure email reset flow</li>
      <li><FaCheckCircle aria-hidden="true" /> Return to your learning space</li>
    </ul>
    <div className="ace-auth__mascot" aria-hidden="true" />
  </aside>
);

export default ForgotPasswordPage;
