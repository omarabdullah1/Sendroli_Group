import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';
import './WebsiteLogin.css';

const WebsiteLogin = () => {
  const navigate = useNavigate();
  const { login: authLogin, deviceConflictError, clearDeviceConflictError } = useAuth();
  const [formData, setFormData] = useState({
    username: '', // Can be username, email, or phone
    password: '',
  });
  // Show password toggle removed to keep the UI simple and consistent
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deviceConflict, setDeviceConflict] = useState(null);
  const [loginMode, setLoginMode] = useState('username'); // username, email, or phone
  const [passwordRequired, setPasswordRequired] = useState(true);
  const [phoneIsClient, setPhoneIsClient] = useState(false);
  const [isPhoneInput, setIsPhoneInput] = useState(false);
  const phoneCheckTimer = useRef(null);
  // Removed manual toggle as UI should not expose it for phone logins.

  // Detect login type based on input
  const detectLoginType = (value) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    const trimmed = value.trim();
    if (phoneRegex.test(trimmed) && trimmed.length > 0) {
      setLoginMode('phone');
      // When username input is phone, always hide the password and clear any existing password value
      setPasswordRequired(false);
      setFormData(prev => ({ ...prev, password: '' }));
      // No-op: showPassword removed
      // Manual toggle removed; no-op
      setIsPhoneInput(true);
    } else if (value.includes('@')) {
      setLoginMode('email');
      // For non-phone inputs require password
      setPasswordRequired(true);
      setIsPhoneInput(false);
    } else {
      setLoginMode('username');
      setPasswordRequired(true);
      setIsPhoneInput(false);
    }
  };

  // Clear device conflict error when component mounts
  useEffect(() => {
    if (deviceConflictError) {
      clearDeviceConflictError();
    }
  }, [deviceConflictError, clearDeviceConflictError]);

  // Run detection on mount in case browser autofills or value is pre-populated
  useEffect(() => {
    detectLoginType(formData.username);
    return () => {
      if (phoneCheckTimer.current) clearTimeout(phoneCheckTimer.current);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Debounce detect login type when username field changes (handles paste/auto-fill)
    if (name === 'username') {
      // Quick immediate detection: if it looks like a phone, clear password instantly and hide password
      const phoneQuickRegex = /^[\d\s\-\+\(\)]+$/;
      if (phoneQuickRegex.test(value.trim()) && value.trim().length > 0) {
        setFormData(prev => ({ ...prev, password: '' }));
        setPasswordRequired(false);
        // showPassword not used anymore
        // Removed manual toggle control (no-op)
        setIsPhoneInput(true);
      }
      if (phoneCheckTimer.current) clearTimeout(phoneCheckTimer.current);
      phoneCheckTimer.current = setTimeout(() => {
        detectLoginType(value);
      }, 200);
    }
    
    setError('');
    if (deviceConflict) setDeviceConflict(null);
  };

  // Note: We intentionally do not check server-side to detect 'client' role; the UI hides password for phone input only,
  // backend will enforce password requirement for non-client roles if necessary.

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDeviceConflict(null);
    setLoading(true);

    try {
      // If this is a phone (client) login, don't send password at all
      const passwordToSend = loginMode === 'phone' ? null : formData.password;
      // Clear form password state when performing phone-only login to be extra safe
      if (loginMode === 'phone') setFormData(prev => ({ ...prev, password: '' }));
      const response = await authLogin(formData.username, passwordToSend);

      if (response.success) {
        // Show any warning returned
        if (response.data?.warning) {
          console.warn('⚠️ Login warning:', response.data.warning);
          alert(response.data.warning);
          setPhoneIsClient(false);
        }

        const userData = response.user || response.data || response;
        const role = userData?.role;
        const redirectUrl = userData?.redirectUrl;

        if (!role) {
          setError('Login failed - invalid user data');
          return;
        }

        if (['admin', 'receptionist', 'designer', 'worker', 'financial'].includes(role)) {
          navigate('/dashboard');
        } else if (role === 'client') {
          navigate('/client-portal');
        } else {
          navigate(redirectUrl || '/dashboard');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Invalid username or password';
      const errorCode = err.response?.data?.code;

      if (err.response?.status === 409 && errorCode === 'ACTIVE_SESSION') {
        const sessionInfo = err.response?.data?.sessionInfo || {};
        setDeviceConflict({
          message: errorMessage,
          conflictInfo: {
            existingDevice: sessionInfo.deviceName || sessionInfo.deviceType,
            existingIP: sessionInfo.ipAddress,
            loginTime: sessionInfo.loginTime,
            lastActivity: sessionInfo.lastActivity,
          },
        });
      } else if (errorCode === 'DEVICE_CONFLICT') {
        setDeviceConflict({
          message: errorMessage,
          conflictInfo: err.response?.data?.conflictInfo,
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
      if (loginMode === 'phone') setFormData(prev => ({ ...prev, password: '' }));
      const response = await authLogin(formData.username, passwordToSend, true); // force=true
      console.log('✅ Force login response:', response);
      
      if (response.success) {
        console.log('🎉 Force login successful');
        
        // Get user data from response
        const userData = response.user || response.data || response;
        const role = userData?.role;
        
        if (!role) {
          console.error('❌ No role found in force login response:', response);
          setError('Force login failed - invalid user data');
          return;
        }
        
        // Show force login message if provided
        if (response.message) {
          console.log('📝 Force login message:', response.message);
        }
        
        // Role-based redirect
        if (['admin', 'receptionist', 'designer', 'worker', 'financial'].includes(role)) {
          navigate('/dashboard');
        } else if (role === 'client') {
          navigate('/client-portal');
        } else {
          navigate('/dashboard');
        }
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
                className="force-login-btn"
              >
                {loading ? 'Forcing Login...' : 'Force Login Here'}
              </button>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">
              {loginMode === 'phone' ? 'Phone Number' : 
               loginMode === 'email' ? 'Email Address' : 
               'Username / Email / Phone'}
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder={
                loginMode === 'phone' ? 'Enter your phone number' :
                loginMode === 'email' ? 'Enter your email' :
                'Enter username, email, or phone'
              }
              required
              autoComplete="username"
            />
            {loginMode === 'phone' && (
              <div className="phone-hint">
                <small className="form-hint">
                  📱 Phone-only login — no password is required for client accounts. If you're a staff/admin, please use username or email and your password.
                </small>
              </div>
            )}
          </div>

          {passwordRequired && (
            <div className="form-group">
            <label htmlFor="password">
              Password {!passwordRequired && '(Optional for phone login)'}
            </label>
              <div className="password-input-wrapper">
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={passwordRequired ? "Enter your password" : "Optional for phone login"}
                required={passwordRequired}
                autoComplete="current-password"
              />
              {/* Password visibility toggle removed - no toggle buttons while typing phone */}
            </div>
            </div>
          )}

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading || deviceConflict}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p className="register-text">
            New Client? <Link to="/register" className="register-link">Create an account</Link>
          </p>
          <p className="login-info">
            For admin/team access, please use your existing credentials.
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

