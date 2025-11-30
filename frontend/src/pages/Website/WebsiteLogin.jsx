import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';
import './WebsiteLogin.css';

const WebsiteLogin = () => {
  const navigate = useNavigate();
  const { login: authLogin, deviceConflictError, clearDeviceConflictError } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deviceConflict, setDeviceConflict] = useState(null);

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
    setError('');
    if (deviceConflict) setDeviceConflict(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDeviceConflict(null);
    setLoading(true);

    try {
      // Use AuthContext login which handles token storage
      const response = await authLogin(formData.username, formData.password);
      
      if (response.success) {
        // Show warning if provided in response
        if (response.data?.warning) {
          console.warn('⚠️ Login warning:', response.data.warning);
          // Could show a toast notification here
          alert(response.data.warning); // Temporary alert for warning
        }
        
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
      const errorCode = err.response?.data?.code;
      
      if (errorCode === 'DEVICE_CONFLICT') {
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
      const response = await authLogin(formData.username, formData.password, true); // force=true
      console.log('✅ Force login response:', response);
      
      if (response.status === 'force_login_success') {
        console.log('🎉 Force login successful');
        // Show warning if provided in response
        if (response.data?.warning) {
          console.warn('⚠️ Force login warning:', response.data.warning);
          // Could show a toast or alert here
          alert(response.data.warning); // Temporary alert for warning
        }
        const userData = response.data;
        const role = userData.role;
        
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
            disabled={loading || deviceConflict}
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

