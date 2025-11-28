import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';
import './WebsiteLogin.css';

const WebsiteLogin = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use AuthContext login which handles token storage
      const response = await authLogin(formData.username, formData.password);
      
      if (response.success) {
        const userData = response.data;
        const role = userData.role;
        const redirectUrl = userData.redirectUrl;
        
        // Role-based redirect
        if (['admin', 'receptionist', 'designer', 'worker', 'financial'].includes(role)) {
          // Redirect to ERP dashboard
          navigate('/dashboard');
        } else if (role === 'client') {
          // Redirect to client portal
          navigate('/client-portal');
        } else {
          // Fallback - use redirectUrl from backend or default to dashboard
          navigate(redirectUrl || '/dashboard');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Invalid username or password';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="website-login-container">
      <div className="website-login-wrapper">
        <div className="login-header">
          <Link to="/" className="back-link">
            ← Back to Website
          </Link>
          <div className="login-logo">
            <Logo variant="full" size="medium" alt="Sendroli Group" />
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to access your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-alert">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <button className="register-btn-disabled" disabled>
            Register (Coming Soon)
          </button>
          <p className="login-info">
            For admin/team access, please use your existing credentials.
            Client registration will be available soon.
          </p>
        </div>
      </div>

      <div className="login-background">
        <div className="gradient-overlay"></div>
      </div>
    </div>
  );
};

export default WebsiteLogin;

