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
    
    // Check session every 10 seconds for faster force logout detection
    sessionCheckIntervalRef.current = setInterval(checkSessionValidity, 10000);
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

    // Cleanup on unmount
    return () => {
      stopSessionMonitoring();
    };
  }, []);

  const login = async (username, password, force = false) => {
    console.log('🔐 AuthContext: login called with force =', force);
    try {
      setDeviceConflictError(null);
      console.log('📡 AuthContext: calling authService.login');
      const userData = await authService.login(username, password, force);
      console.log('📡 AuthContext: authService.login returned:', userData);
      setUser(userData.data || userData);
      startSessionMonitoring();
      console.log('✅ AuthContext: login successful');
      return userData;
    } catch (error) {
      console.log('❌ AuthContext: login failed:', error);
      // Handle device conflict errors during login
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message;
      
      if (errorCode === 'DEVICE_CONFLICT') {
        setDeviceConflictError({
          message: errorMessage,
          code: errorCode,
          conflictInfo: error.response?.data?.conflictInfo || null
        });
      }
      throw error;
    }
  };

  const register = async (userData) => {
    const newUser = await authService.register(userData);
    setUser(newUser);
    return newUser;
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
    logout,
    hasRole,
    clearDeviceConflictError,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
