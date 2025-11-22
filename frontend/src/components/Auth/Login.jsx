import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState('');
  const { login, deviceConflictError, clearDeviceConflictError } = useAuth();
  const navigate = useNavigate();

  // Detect device information
  useEffect(() => {
    const userAgent = navigator.userAgent;
    let device = 'Unknown Device';
    
    if (/Mobile/.test(userAgent)) {
      device = 'Mobile Device';
    } else if (/Chrome/.test(userAgent)) {
      device = 'Chrome Browser';
    } else if (/Firefox/.test(userAgent)) {
      device = 'Firefox Browser';
    } else if (/Safari/.test(userAgent)) {
      device = 'Safari Browser';
    } else if (/Edge/.test(userAgent)) {
      device = 'Edge Browser';
    }
    
    setDeviceInfo(device);
  }, []);

  // Clear device conflict error when component mounts
  useEffect(() => {
    if (deviceConflictError) {
      clearDeviceConflictError();
    }
  }, [deviceConflictError, clearDeviceConflictError]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(formData.username, formData.password);
      
      if (response.success) {
        console.log('🎉 Single login successful for device:', deviceInfo);
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      const errorCode = err.response?.data?.code;
      
      if (errorCode === 'DEVICE_CONFLICT') {
        setError('Another device is currently logged in with this account. This login will invalidate the previous session.');
        // Small delay then try login anyway since it will invalidate other session
        setTimeout(async () => {
          try {
            const retryResponse = await login(formData.username, formData.password);
            if (retryResponse.success) {
              navigate('/dashboard');
            }
          } catch (retryErr) {
            setError(retryErr.response?.data?.message || 'Login failed after device conflict');
          }
        }, 2000);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Factory Management System</h2>
        <h3>Single Device Login</h3>
        
        {/* Device Info Display */}
        <div className="device-info">
          <small>Logging in from: {deviceInfo}</small>
        </div>

        {/* Device Conflict Alert */}
        {deviceConflictError && (
          <div className="device-conflict-alert">
            <strong>⚠️ Session Invalidated</strong>
            <p>{deviceConflictError}</p>
            <p>Please login again to continue.</p>
          </div>
        )}

        {/* Regular Error Display */}
        {error && (
          <div className={`error-message ${error.includes('device') ? 'device-warning' : ''}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
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
              required
              disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Logging in...' : 'Login (Single Device)'}
          </button>
        </form>

        {/* Security Notice */}
        <div className="security-notice">
          <small>
            🔒 <strong>Security Notice:</strong> Only one device can be logged in at a time. 
            Logging in here will automatically logout other devices.
          </small>
        </div>

        <p className="auth-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
