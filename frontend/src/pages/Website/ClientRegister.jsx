import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo';
import authService from '../../services/authService';
import './WebsiteLogin.css'; // Reuse the same styles

const ClientRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    factoryName: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return;
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Please enter a valid phone number');
      return;
    }

    // Validate email format if provided
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Registering client (phone-only, no password)');
      const response = await authService.registerClient(formData);
      
      if (response.success) {
        // Registration successful - redirect to client portal
        console.log('✅ Client registration successful');
        navigate('/client-portal');
      }
    } catch (err) {
      console.error('❌ Registration error:', err);
      const errorMessage = err.response?.data?.message || 'Registration failed';
      
      // Provide helpful error messages
      if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
        setError('This phone number is already registered. Please try logging in instead.');
      } else if (errorMessage.includes('validation failed')) {
        setError('Please check all fields and try again');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="website-login-container">
      <div className="website-login-wrapper">
        <div className="login-header">
          <Link to="/login" className="back-link">
            ← Back to Login
          </Link>
          <div className="login-logo">
            <Logo variant="full" size="medium" alt="Sendroli Group" />
          </div>
          <h1>Create Account</h1>
          <p>Register to manage your orders</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-alert">{error}</div>}

          <div className="info-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <p>No password required! Simply log in with your phone number.</p>
          </div>

          <div className="form-group">
            <label htmlFor="fullName">Full Name *</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1234567890 or 0123456789"
              required
              autoComplete="tel"
            />
            <small className="form-hint">Use this phone number to log in later</small>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email (Optional)</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="factoryName">Factory Name (Optional)</label>
            <input
              type="text"
              id="factoryName"
              name="factoryName"
              value={formData.factoryName}
              onChange={handleChange}
              placeholder="Your factory or business name"
              autoComplete="organization"
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Address (Optional)</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Your business address"
              autoComplete="address-line1"
            />
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="login-footer">
          <p className="register-text">
            Already have an account? <Link to="/login" className="register-link">Sign in</Link>
          </p>
          <p className="login-info">
            Passwordless login - just use your phone number to access your account.
          </p>
        </div>
      </div>

      <div className="login-background">
        <div className="gradient-overlay"></div>
      </div>
    </div>
  );
};

export default ClientRegister;
