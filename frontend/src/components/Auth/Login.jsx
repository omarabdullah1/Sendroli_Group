import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loginMode, setLoginMode] = useState('username'); // username, email, or phone
  const [passwordRequired, setPasswordRequired] = useState(true);
  const [isPhoneInput, setIsPhoneInput] = useState(false);
  const phoneCheckTimer = useRef(null);
  // Manual toggle removed; UI should not expose manual password toggle for phone input
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

  // Run detection on mount in case browser autofills the username field
  useEffect(() => {
    detectLoginType(formData.username);
    return () => {
      if (phoneCheckTimer.current) clearTimeout(phoneCheckTimer.current);
    };
  }, []);

  // Clear device conflict error when component mounts
  useEffect(() => {
    if (deviceConflictError) {
      clearDeviceConflictError();
    }
  }, [deviceConflictError, clearDeviceConflictError]);

  // Detect login type based on input
  const detectLoginType = (value) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    const trimmed = value.trim();
    if (phoneRegex.test(trimmed) && trimmed.length > 0) {
      setLoginMode('phone');
      // Always hide the password and clear any existing password value when username is a phone
      setPasswordRequired(false);
      setFormData(prev => ({ ...prev, password: '' }));
      setIsPhoneInput(true);
      // Ensure manual toggle is reset when phone input is detected
      // Ensure no manual toggle persists; removed manual toggle control
    } else if (value.includes('@')) {
      setLoginMode('email');
      setPasswordRequired(true);
      setIsPhoneInput(false);
    } else {
      setLoginMode('username');
      setPasswordRequired(true);
      setIsPhoneInput(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Detect login type when user types username (debounce to avoid rapid checks)
    if (e.target.name === 'username') {
      // Quick immediate detection: if it looks like a phone, clear password immediately and hide it
      const phoneQuickRegex = /^[\d\s\-\+\(\)]+$/;
      if (phoneQuickRegex.test(value.trim()) && value.trim().length > 0) {
        setFormData(prev => ({ ...prev, password: '' }));
        setPasswordRequired(false);
        setIsPhoneInput(true);
        // Removed manual toggle control
      }
      if (phoneCheckTimer.current) clearTimeout(phoneCheckTimer.current);
      phoneCheckTimer.current = setTimeout(() => {
        detectLoginType(e.target.value);
      }, 200);
    }

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
      const passwordToSend = loginMode === 'phone' ? null : formData.password;
      const response = await login(formData.username, passwordToSend);
      
      if (response.success) {
        console.log('🎉 Single login successful for device:', deviceInfo);
        // Show warning if provided in response
        if (response.data?.warning) {
          console.warn('⚠️ Login warning:', response.data.warning);
          // Could show a toast notification here
          alert(response.data.warning); // Temporary alert for warning
        }
        
        // Redirect based on role
        const user = response.user || response.data?.user;
        if (user?.role === 'client') {
          navigate('/client-portal');
        } else {
          navigate('/dashboard');
        }
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
      const passwordToSend = loginMode === 'phone' ? null : formData.password;
      const response = await login(formData.username, passwordToSend, true); // force=true
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
            <label htmlFor="username">{loginMode === 'phone' ? 'Phone Number' : 'Username'}</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
            />
            {loginMode === 'phone' && (
              <div className="phone-hint">
                <small className="form-hint">📱 Phone-only login — no password is required for client accounts.</small>
              </div>
            )}
          </div>
          {passwordRequired && (
            <div className="form-group">
              <label htmlFor="password">Password {!passwordRequired && '(Optional for phone login)'}</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={passwordRequired}
                disabled={loading}
              />
            </div>
          )}
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
