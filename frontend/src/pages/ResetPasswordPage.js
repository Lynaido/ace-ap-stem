import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authAPI } from '../utils/api';

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
      <section className="signin-section">
        <div className="signin-container">
          <div className="signin-header">
            <h1>Password Reset!</h1>
            <p>Your password has been successfully changed</p>
          </div>

          <div className="signin-card">
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginBottom: '1rem' }}
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                Redirecting you to sign in...
              </p>
              <Link to="/sign-in" className="btn-signin" style={{ textAlign: 'center', display: 'block' }}>
                Sign In Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="signin-section">
      <div className="signin-container">
        <div className="signin-header">
          <h1>Create New Password</h1>
          <p>Enter your new password below</p>
        </div>

        <div className="signin-card">
          <form onSubmit={handleSubmit} className="signin-form">
            <div className="form-group">
              <label htmlFor="password">New Password *</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter new password"
                className={errors.password ? 'error' : ''}
                required
                autoComplete="new-password"
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password *</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                className={errors.confirmPassword ? 'error' : ''}
                required
                autoComplete="new-password"
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>

            <button
              type="submit"
              className="btn-signin"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="signin-divider">
            <span>Changed your mind?</span>
          </div>

          <Link to="/sign-in" className="btn-signup">
            Back to Sign In
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ResetPasswordPage;
