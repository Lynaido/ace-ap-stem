import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const SignInPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simple validation
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }
    
    // Simulate API call
    setTimeout(() => {
      // Mock login
      login({
        id: '1',
        name: 'Student User',
        email: email
      });
      
      // Clear errors and navigate
      setErrors({});
      setIsSubmitting(false);
      
      // Navigate to dashboard or home
      navigate('/');
    }, 1000);
  };

  return (
    <section className="signin-section">
      <div className="signin-container">
        <div className="signin-header">
          <h1>Welcome Back</h1>
          <p>Sign in to continue your learning journey with AAS</p>
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
            
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={errors.password ? 'error' : ''}
                required
                autoComplete="current-password"
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="signin-forgot">
              <Link to="/forgot-password">Forgot your password?</Link>
            </div>
            
            <button 
              type="submit" 
              className="btn-signin"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="signin-divider">
            <span>New to AAS?</span>
          </div>

          <Link to="/sign-up" className="btn-signup">
            Create Account
          </Link>
        </div>

        <div className="signin-footer">
          <p>
            By signing in, you agree to our{' '}
            <Link to="/privacy">Privacy Policy</Link> and{' '}
            <Link to="/terms">Terms of Service</Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default SignInPage;
