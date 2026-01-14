import { createContext, useContext, useEffect, useRef, useState } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deviceConflictError, setDeviceConflictError] = useState(null);
  const sessionCheckIntervalRef = useRef(null);

  // Check session validity periodically
  const checkSessionValidity = async () => {
    if (!user) return;

    try {
      const sessionValidation = await authService.validateSession();

      // Check if session version has changed (indicating force logout)
      const storedUser = authService.getCurrentUser();
      if (storedUser && storedUser.sessionInfo &&
        sessionValidation.data.sessionVersion !== storedUser.sessionInfo.sessionVersion) {
        console.log('Session version mismatch - force logout detected');
        handleForceLogout('Your session has been terminated from another device');
        return;
      }

      // Update last activity
      console.log('Session validated successfully');
    } catch (error) {
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message;

      if (errorCode === 'DEVICE_CONFLICT' || errorCode === 'SESSION_TERMINATED' ||
        errorCode === 'DEVICE_MISMATCH' || errorCode === 'INVALID_SESSION') {
        setDeviceConflictError({
          message: errorMessage,
          code: errorCode,
          conflictInfo: error.response?.data?.conflictInfo || null
        });
        handleForceLogout('Session terminated due to device conflict');
      } else if (errorCode === 'TOKEN_EXPIRED') {
        handleForceLogout('Session expired');
      } else if (error.response?.status === 401) {
        handleForceLogout('Authentication failed');
      }
    }
  };

  // Force logout due to session issues
  const handleForceLogout = (reason) => {
    console.log('Force logout:', reason);
    authService.clearStoredAuth();
    setUser(null);
    setDeviceConflictError(reason);

    // Clear session check interval
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
      sessionCheckIntervalRef.current = null;
    }
  };

  // Start session monitoring
  const startSessionMonitoring = () => {
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
    }

    // Check session every 5 minutes (reduced from 10 seconds for better performance)
    // Session expiry is typically 24h, so 5min is sufficient
    sessionCheckIntervalRef.current = setInterval(() => {
      // Only validate if tab is visible
      if (!document.hidden) {
        checkSessionValidity();
      }
    }, 300000); // 5 minutes = 300000ms
  };

  // Stop session monitoring
  const stopSessionMonitoring = () => {
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
      sessionCheckIntervalRef.current = null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = authService.getCurrentUser();
      if (storedUser) {
        try {
          // Verify the stored session is still valid
          await authService.getMe();
          setUser(storedUser);
          startSessionMonitoring();
        } catch (error) {
          // Session is invalid, clear stored data
          authService.clearStoredAuth();
          console.log('Stored session invalid:', error.response?.data?.message);
        }
      }
      setLoading(false);
    };

    initAuth();

    // Add visibility change listener to validate session when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        checkSessionValidity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      stopSessionMonitoring();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const login = async (username, password, force = false) => {
    console.log('🔐 AuthContext: login called with force =', force);
    try {
      setDeviceConflictError(null);
      console.log('📡 AuthContext: calling authService.login');
      const response = await authService.login(username, password, force);
      console.log('📡 AuthContext: authService.login returned:', response);

      // Extract user object from response
      const userObject = response.user || response.data?.user || response.data;
      console.log('👤 AuthContext: Setting user:', userObject);
      setUser(userObject);
      startSessionMonitoring();
      console.log('✅ AuthContext: login successful');
      return response;
    } catch (error) {
      console.log('❌ AuthContext: login failed:', error);
      // Handle session conflict errors during login
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message;

      // Handle both new ACTIVE_SESSION and legacy DEVICE_CONFLICT codes
      if (errorCode === 'ACTIVE_SESSION' || errorCode === 'DEVICE_CONFLICT') {
        const sessionInfo = error.response?.data?.sessionInfo;
        setDeviceConflictError({
          message: errorMessage,
          code: errorCode,
          conflictInfo: sessionInfo ? {
            existingDevice: sessionInfo.deviceName || sessionInfo.deviceType,
            existingIP: sessionInfo.ipAddress,
            loginTime: sessionInfo.loginTime,
            lastActivity: sessionInfo.lastActivity
          } : error.response?.data?.conflictInfo || null
        });
      }
      throw error;
    }
  };

  const register = async (userData) => {
    const newUser = await authService.register(userData);
    // Admin registration doesn't auto-login the new user usually, but returns data
    return newUser;
  };

  const registerClient = async (userData) => {
    const response = await authService.registerClient(userData);
    if (response.success) {
      // registerClient returns { success: true, data: { user..., token... } }
      // We need to set the user state
      setUser(response.data);
      startSessionMonitoring();
    }
    return response;
  };

  const logout = async () => {
    try {
      // Call backend logout to clear activeToken
      await authService.logout();
    } catch (error) {
      console.log('Backend logout error:', error);
    } finally {
      // Always clear local state
      authService.clearStoredAuth();
      setUser(null);
      setDeviceConflictError(null);
      stopSessionMonitoring();
    }
  };

  const clearDeviceConflictError = () => {
    setDeviceConflictError(null);
  };

  const hasRole = (...roles) => {
    return user && roles.includes(user.role);
  };

  const value = {
    user,
    loading,
    deviceConflictError,
    login,
    register,
    registerClient,
    logout,
    hasRole,
    clearDeviceConflictError,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
