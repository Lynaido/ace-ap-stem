import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import { FaArrowRight, FaCheckCircle } from 'react-icons/fa';
import './AuthPages.css';

const SignInPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const { login } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state && location.state.message) {
      setAuthMessage(location.state.message);
      // Clear the message after 5 seconds
      const timer = setTimeout(() => setAuthMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Check for logout success parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('logout') === 'success') {
      toast.success('Logged Out', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });

      // Clean up the URL
      const newUrl = location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location.search, location.pathname]);

  // Show toast for login errors
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

    // Clear previous errors
    setErrors({});

    // Simple validation
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Real API call
      await login({ email, password });

      // Clear errors and navigate
      setErrors({});
      setIsSubmitting(false);

      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (error) {
      setErrors({ general: error.message || 'Login failed. Please try again.' });
      setIsSubmitting(false);
    }
  };

  return (
    <section className="ace-auth" aria-labelledby="sign-in-title">
      <div className="ace-auth__shell">
        <aside className="ace-auth__story">
          <Link to="/" className="ace-auth__brand" aria-label="ACE AP STEM home">
            <img src="/logo.png" alt="" width="40" height="40" />
            <span>ACE AP STEM</span>
          </Link>
          <div className="ace-auth__story-copy">
            <span>Your study companion</span>
            <h2>Pick up right where you left off.</h2>
            <p>Return to saved notes, guided problem solving, and focused AP STEM practice.</p>
          </div>
          <ul className="ace-auth__benefits">
            <li><FaCheckCircle aria-hidden="true" /> Guided hints before full solutions</li>
            <li><FaCheckCircle aria-hidden="true" /> Notes and study sessions in one place</li>
          </ul>
          <div className="ace-auth__mascot" aria-hidden="true" />
        </aside>

        <div className="ace-auth__content">
          <div className="ace-auth__content-inner">
            <header className="ace-auth__header">
              <h1 id="sign-in-title">Welcome back</h1>
              <p>Sign in to continue learning with ACE.</p>
            </header>

            {authMessage && <div className="ace-auth__notice" role="status">{authMessage}</div>}
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
                aria-describedby={errors.email ? 'sign-in-email-error' : undefined}
                required
                autoComplete="email"
              />
                {errors.email && <span className="ace-auth__field-error" id="sign-in-email-error">{errors.email}</span>}
              </div>

              <div className="ace-auth__field">
                <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'sign-in-password-error' : undefined}
                required
                autoComplete="current-password"
              />
                {errors.password && <span className="ace-auth__field-error" id="sign-in-password-error">{errors.password}</span>}
              </div>

              <div className="ace-auth__form-meta">
                <Link to="/forgot-password">Forgot password?</Link>
              </div>

            <button
              type="submit"
                className="ace-auth__primary"
              disabled={isSubmitting}
            >
                {isSubmitting ? 'Signing in...' : <><span>Sign in</span><FaArrowRight aria-hidden="true" /></>}
            </button>
          </form>

            <div className="ace-auth__divider">
            <span>New to AAS?</span>
          </div>

            <Link to="/sign-up" className="ace-auth__secondary">
            Create Account
          </Link>

            <p className="ace-auth__legal">
              By signing in, you acknowledge our <Link to="/privacy">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignInPage;
