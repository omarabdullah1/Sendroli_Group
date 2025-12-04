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
  const [deviceConflict, setDeviceConflict] = useState(null);
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
    if (deviceConflict) setDeviceConflict(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDeviceConflict(null);
    setLoading(true);

    try {
      const response = await login(formData.username, formData.password);
      
      if (response.success) {
        console.log('🎉 Single login successful for device:', deviceInfo);
        // Show warning if provided in response
        if (response.data?.warning) {
          console.warn('⚠️ Login warning:', response.data.warning);
          // Could show a toast notification here
          alert(response.data.warning); // Temporary alert for warning
        }
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      const errorCode = err.response?.data?.code;
      
      // Handle session conflict (409 status with ACTIVE_SESSION code)
      if (err.response?.status === 409 && errorCode === 'ACTIVE_SESSION') {
        const sessionInfo = err.response?.data?.sessionInfo || {};
        setDeviceConflict({
          message: errorMessage,
          conflictInfo: {
            existingDevice: sessionInfo.deviceName || sessionInfo.deviceType,
            existingIP: sessionInfo.ipAddress,
            loginTime: sessionInfo.loginTime,
            lastActivity: sessionInfo.lastActivity
          }
        });
      } else if (errorCode === 'DEVICE_CONFLICT') {
        // Legacy support for old error code
        setDeviceConflict({
          message: errorMessage,
          conflictInfo: err.response?.data?.conflictInfo
        });
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogin = async () => {
    console.log('🔄 Force login button clicked');
    setError('');
    setLoading(true);

    try {
      console.log('🚀 Calling login with force=true');
      const response = await login(formData.username, formData.password, true); // force=true
      console.log('✅ Force login response:', response);
      
      if (response.status === 'force_login_success') {
        console.log('🎉 Force login successful for device:', deviceInfo);
        // Show warning if provided in response
        if (response.warning) {
          console.warn('⚠️ Force login warning:', response.warning);
          // Could show a toast or alert here
        }
        navigate('/dashboard');
      } else {
        console.log('❌ Force login failed - unexpected response:', response);
        setError('Force login failed - unexpected response');
      }
    } catch (err) {
      console.error('💥 Force login error:', err);
      const errorMessage = err.response?.data?.message || 'Force login failed';
      setError(errorMessage);
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
        {deviceConflict && (
          <div className="device-conflict-alert">
            <strong>⚠️ Another Device Active</strong>
            <p>{deviceConflict.message}</p>
            <div className="conflict-details">
              <small>
                <strong>Existing session:</strong><br/>
                Device: {deviceConflict.conflictInfo?.existingDevice || 'Unknown'}<br/>
                IP: {deviceConflict.conflictInfo?.existingIP}<br/>
                Login Time: {deviceConflict.conflictInfo?.loginTime ? new Date(deviceConflict.conflictInfo.loginTime).toLocaleString() : 'Unknown'}
              </small>
            </div>
            <button 
              type="button" 
              onClick={handleForceLogin} 
              disabled={loading}
              className="btn-force-login"
            >
              {loading ? 'Forcing Login...' : 'Force Login Here'}
            </button>
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
          <button type="submit" disabled={loading || deviceConflict} className="btn-primary">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Security Notice */}
        <div className="security-notice">
          <small>
            🔒 <strong>Security Notice:</strong> Only one device can be logged in at a time. 
            Use "Force Login Here" to terminate other sessions.
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
