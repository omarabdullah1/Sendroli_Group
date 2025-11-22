import { useAuth } from '../../context/AuthContext';
import './DeviceConflictNotification.css';

const DeviceConflictNotification = () => {
  const { deviceConflictError, clearDeviceConflictError, logout } = useAuth();

  if (!deviceConflictError) return null;

  const handleLoginElsewhere = () => {
    clearDeviceConflictError();
    window.location.href = '/login';
  };

  return (
    <div className="device-conflict-overlay">
      <div className="device-conflict-modal">
        <div className="device-conflict-header">
          <h3>⚠️ Session Invalidated</h3>
        </div>
        <div className="device-conflict-body">
          <p><strong>{deviceConflictError}</strong></p>
          <p>Your session has been invalidated because you logged in from another device.</p>
          <p>For security reasons, only one active session is allowed per account.</p>
        </div>
        <div className="device-conflict-actions">
          <button 
            className="btn btn-primary"
            onClick={handleLoginElsewhere}
          >
            Login Again
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => logout()}
          >
            Logout Completely
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceConflictNotification;