import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import { FaArrowRight, FaCheckCircle } from 'react-icons/fa';
import './AuthPages.css';

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAppContext();
  const navigate = useNavigate();

  // Show toast for registration errors
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
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

    // Clear previous errors
    setErrors({});

    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Real API call
      await register({
        email: formData.email,
        password: formData.password,
        name: `${formData.firstName} ${formData.lastName}`
      });

      // Clear errors and navigate
      setErrors({});
      setIsSubmitting(false);

      navigate('/dashboard', { replace: true });
    } catch (error) {
      setErrors({ general: error.message || 'Registration failed. Please try again.' });
      setIsSubmitting(false);
    }
  };

  return (
    <section className="ace-auth" aria-labelledby="sign-up-title">
      <div className="ace-auth__shell">
        <aside className="ace-auth__story">
          <Link to="/" className="ace-auth__brand" aria-label="ACE AP STEM home">
            <img src="/logo.png" alt="" width="40" height="40" />
            <span>ACE AP STEM</span>
          </Link>
          <div className="ace-auth__story-copy">
            <span>Learn with purpose</span>
            <h2>Build understanding one step at a time.</h2>
            <p>Create an account to keep your notes, solutions, and study sessions together.</p>
          </div>
          <ul className="ace-auth__benefits">
            <li><FaCheckCircle aria-hidden="true" /> Practice across AP STEM subjects</li>
            <li><FaCheckCircle aria-hidden="true" /> Save useful explanations for review</li>
          </ul>
          <div className="ace-auth__mascot" aria-hidden="true" />
        </aside>

        <div className="ace-auth__content">
          <div className="ace-auth__content-inner">
            <header className="ace-auth__header">
              <h1 id="sign-up-title">Create your account</h1>
              <p>Set up your learning space with ACE.</p>
            </header>

            {errors.general && <div className="ace-auth__error-banner" role="alert">{errors.general}</div>}

            <form onSubmit={handleSubmit} className="ace-auth__form" noValidate>
              <div className="ace-auth__name-grid">
                <div className="ace-auth__field">
                  <label htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter your first name"
                  aria-invalid={Boolean(errors.firstName)}
                  aria-describedby={errors.firstName ? 'sign-up-first-name-error' : undefined}
                  required
                  autoComplete="given-name"
                />
                  {errors.firstName && <span className="ace-auth__field-error" id="sign-up-first-name-error">{errors.firstName}</span>}
              </div>

                <div className="ace-auth__field">
                  <label htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter your last name"
                  aria-invalid={Boolean(errors.lastName)}
                  aria-describedby={errors.lastName ? 'sign-up-last-name-error' : undefined}
                  required
                  autoComplete="family-name"
                />
                  {errors.lastName && <span className="ace-auth__field-error" id="sign-up-last-name-error">{errors.lastName}</span>}
                </div>
              </div>

              <div className="ace-auth__field">
                <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'sign-up-email-error' : undefined}
                required
                autoComplete="email"
              />
                {errors.email && <span className="ace-auth__field-error" id="sign-up-email-error">{errors.email}</span>}
            </div>

              <div className="ace-auth__field">
                <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'sign-up-password-error' : undefined}
                required
                autoComplete="new-password"
              />
                {errors.password && <span className="ace-auth__field-error" id="sign-up-password-error">{errors.password}</span>}
            </div>

              <div className="ace-auth__field">
                <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? 'sign-up-confirm-password-error' : undefined}
                required
                autoComplete="new-password"
              />
                {errors.confirmPassword && <span className="ace-auth__field-error" id="sign-up-confirm-password-error">{errors.confirmPassword}</span>}
            </div>

            <button 
              type="submit" 
                className="ace-auth__primary"
              disabled={isSubmitting}
            >
                {isSubmitting ? 'Creating account...' : <><span>Create account</span><FaArrowRight aria-hidden="true" /></>}
            </button>
          </form>

            <div className="ace-auth__divider">
            <span>Already have an account?</span>
          </div>

            <Link to="/sign-in" className="ace-auth__secondary">
            Sign In
          </Link>

            <p className="ace-auth__legal">
              By creating an account, you acknowledge our <Link to="/privacy">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignUpPage;
