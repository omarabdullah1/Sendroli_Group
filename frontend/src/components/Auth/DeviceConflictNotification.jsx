import { useAuth } from '../../context/AuthContext';
import './DeviceConflictNotification.css';

const DeviceConflictNotification = () => {
  const { deviceConflictError, clearDeviceConflictError, logout } = useAuth();

  if (!deviceConflictError) return null;

  // Handle both string and object error formats
  const errorMessage = typeof deviceConflictError === 'string' 
    ? deviceConflictError 
    : deviceConflictError.message;
  
  const errorCode = typeof deviceConflictError === 'object' 
    ? deviceConflictError.code 
    : null;
    
  const conflictInfo = typeof deviceConflictError === 'object' 
    ? deviceConflictError.conflictInfo 
    : null;

  const getErrorInfo = () => {
    if (errorCode === 'DEVICE_CONFLICT' || errorMessage.includes('Another device is currently logged in')) {
      return {
        icon: '🚫',
        title: 'Device Login Blocked',
        message: 'Only one device can be logged in at a time for your security.',
        details: conflictInfo ? (
          <div className="conflict-details">
            <p><strong>Active Device:</strong> {conflictInfo.existingDevice || 'Unknown'}</p>
            <p><strong>IP Address:</strong> {conflictInfo.existingIP || 'Unknown'}</p>
            <p><strong>Login Time:</strong> {conflictInfo.loginTime ? new Date(conflictInfo.loginTime).toLocaleString() : 'Unknown'}</p>
          </div>
        ) : null,
        showLogout: true
      };
    }
    
    if (errorCode === 'SESSION_TERMINATED' || errorMessage.includes('session has been terminated')) {
      return {
        icon: '🔒',
        title: 'Session Terminated',
        message: 'Your session was ended because another device logged in.',
        showLogout: false
      };
    }
    
    if (errorCode === 'DEVICE_MISMATCH' || errorMessage.includes('Device or location mismatch')) {
      return {
        icon: '🛡️',
        title: 'Security Alert',
        message: 'Your session was terminated due to a security check (device or location change).',
        showLogout: false
      };
    }
    
    // Default
    return {
      icon: '⚠️',
      title: 'Session Invalid',
      message: errorMessage || 'Your session is no longer valid.',
      showLogout: true
    };
  };

  const errorInfo = getErrorInfo();

  const handleLoginAgain = () => {
    clearDeviceConflictError();
    window.location.href = '/login';
  };

  const handleLogout = async () => {
    clearDeviceConflictError();
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="device-conflict-overlay">
      <div className="device-conflict-modal">
        <div className="device-conflict-header">
          <h3>{errorInfo.icon} {errorInfo.title}</h3>
        </div>
        
        <div className="device-conflict-body">
          <p><strong>{errorInfo.message}</strong></p>
          
          {errorInfo.details && (
            <div className="device-conflict-details-section">
              <h4>Current Active Session:</h4>
              {errorInfo.details}
            </div>
          )}
          
          <p>For security reasons, only one active session is allowed per account.</p>
        </div>
        
        <div className="device-conflict-actions">
          <button 
            className="btn btn-primary"
            onClick={handleLoginAgain}
          >
            {errorInfo.showLogout ? 'Force Login Here' : 'Login Again'}
          </button>
          
          {errorInfo.showLogout && (
            <button 
              className="btn btn-secondary"
              onClick={handleLogout}
            >
              Logout Completely
            </button>
          )}
        </div>
        
        <div className="device-conflict-info">
          <small>
            <strong>Security Note:</strong> This feature protects your account from unauthorized access.
          </small>
        </div>
      </div>
    </div>
  );
};

export default DeviceConflictNotification;