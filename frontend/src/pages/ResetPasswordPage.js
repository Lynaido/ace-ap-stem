import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authAPI } from '../utils/api';
import { FaArrowRight, FaCheckCircle, FaLock } from 'react-icons/fa';
import './AuthPages.css';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
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

  // Check for token on mount
  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token', {
        position: "top-right",
        autoClose: 3000,
      });
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await authAPI.resetPassword(token, formData.password);
      setIsSuccess(true);
      toast.success('Password reset successful!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });

      // Redirect to sign-in after 3 seconds
      setTimeout(() => {
        navigate('/sign-in', {
          state: { message: 'Password reset successful. Please sign in with your new password.' }
        });
      }, 3000);
    } catch (error) {
      setErrors({ general: error.message || 'Failed to reset password. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <section className="ace-auth" aria-labelledby="reset-success-title">
        <div className="ace-auth__shell">
          <AuthStory />
          <div className="ace-auth__content">
            <div className="ace-auth__content-inner">
              <header className="ace-auth__header">
                <h1 id="reset-success-title">Password updated</h1>
                <p>Your new password is ready to use.</p>
              </header>
              <div className="ace-auth__success-panel" role="status">
                <FaCheckCircle aria-hidden="true" />
                <p>Redirecting you to sign in...</p>
                <div className="ace-auth__success-actions">
                  <Link to="/sign-in" className="ace-auth__primary">Sign in now <FaArrowRight aria-hidden="true" /></Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="ace-auth" aria-labelledby="reset-title">
      <div className="ace-auth__shell">
        <AuthStory />
        <div className="ace-auth__content">
          <div className="ace-auth__content-inner">
            <header className="ace-auth__header">
              <h1 id="reset-title">Create a new password</h1>
              <p>Choose a password with at least 6 characters.</p>
            </header>
            {errors.general && <div className="ace-auth__error-banner" role="alert">{errors.general}</div>}
            <form onSubmit={handleSubmit} className="ace-auth__form" noValidate>
              <div className="ace-auth__field">
                <label htmlFor="password">New password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter new password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'reset-password-error' : undefined}
                required
                autoComplete="new-password"
              />
                {errors.password && <span className="ace-auth__field-error" id="reset-password-error">{errors.password}</span>}
            </div>

              <div className="ace-auth__field">
                <label htmlFor="confirmPassword">Confirm new password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? 'reset-confirm-error' : undefined}
                required
                autoComplete="new-password"
              />
                {errors.confirmPassword && <span className="ace-auth__field-error" id="reset-confirm-error">{errors.confirmPassword}</span>}
            </div>

            <button
              type="submit"
                className="ace-auth__primary"
              disabled={isSubmitting}
            >
                {isSubmitting ? 'Updating...' : <><span>Update password</span><FaArrowRight aria-hidden="true" /></>}
            </button>
          </form>

            <div className="ace-auth__divider">
            <span>Changed your mind?</span>
          </div>

            <Link to="/sign-in" className="ace-auth__secondary">
            Back to Sign In
          </Link>
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
      <span>Account security</span>
      <h2>A fresh password, then back to progress.</h2>
      <p>Complete this last step to return to your ACE learning space.</p>
    </div>
    <ul className="ace-auth__benefits">
      <li><FaLock aria-hidden="true" /> Protected password reset</li>
      <li><FaCheckCircle aria-hidden="true" /> Your study flow stays familiar</li>
    </ul>
    <div className="ace-auth__mascot" aria-hidden="true" />
  </aside>
);

export default ResetPasswordPage;
