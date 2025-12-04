/**
 * Frontend Session Management Implementation Example
 * 
 * This file demonstrates how to implement the enhanced session management
 * in your React/Vue/Angular frontend application.
 */

// ============================================================
// 1. API Service with Session Handling
// ============================================================

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle session errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorCode = error.response?.data?.code;
    
    // Session invalidation errors - force logout
    const sessionErrors = [
      'TOKEN_INVALIDATED',
      'SESSION_INVALID',
      'SESSION_EXPIRED',
      'TOKEN_EXPIRED',
      'INVALID_TOKEN'
    ];
    
    if (sessionErrors.includes(errorCode)) {
      // Clear stored credentials
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Dispatch logout event for app-wide handling
      window.dispatchEvent(new CustomEvent('session-expired', {
        detail: {
          code: errorCode,
          message: error.response.data.message
        }
      }));
      
      // Redirect to login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?sessionExpired=true';
      }
    }
    
    return Promise.reject(error);
  }
);

// ============================================================
// 2. Authentication Service
// ============================================================

export const authService = {
  /**
   * Login with session conflict detection
   * @param {string} username 
   * @param {string} password 
   * @param {boolean} force - Force login even if session exists
   * @returns {Promise<{success: boolean, data?: any, conflict?: boolean, sessionInfo?: any}>}
   */
  async login(username, password, force = false) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password,
        force
      });
      
      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        return {
          success: true,
          data: response.data,
          token: response.data.token,
          user: response.data.user
        };
      }
      
      return { success: false, message: 'Login failed' };
      
    } catch (error) {
      // Handle 409 Conflict - Active session exists
      if (error.response?.status === 409) {
        return {
          success: false,
          conflict: true,
          sessionInfo: error.response.data.sessionInfo,
          message: error.response.data.message
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  },

  /**
   * Logout and clear session
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Get current user
   */
  async getMe() {
    try {
      const response = await api.get('/auth/me');
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error };
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  /**
   * Get stored user data
   */
  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

// ============================================================
// 3. React Login Component Example
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionConflict, setSessionConflict] = useState(null);

  const handleSubmit = async (e, forceLogin = false) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await authService.login(
      formData.username,
      formData.password,
      forceLogin
    );

    setLoading(false);

    if (result.success) {
      // Login successful
      navigate('/dashboard');
    } else if (result.conflict) {
      // Session conflict - show dialog
      setSessionConflict(result.sessionInfo);
    } else {
      // Login failed
      setError(result.message);
    }
  };

  const handleForceLogin = (e) => {
    setSessionConflict(null);
    handleSubmit(e, true);
  };

  const handleCancelForceLogin = () => {
    setSessionConflict(null);
    setError('');
  };

  return (
    <div className="login-page">
      <h1>Login</h1>
      
      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {/* Session Conflict Dialog */}
      {sessionConflict && (
        <div className="session-conflict-dialog">
          <h3>⚠️ Active Session Detected</h3>
          <p>You have an active session on another device:</p>
          <ul>
            <li><strong>Device:</strong> {sessionConflict.deviceName}</li>
            <li><strong>Last Activity:</strong> {new Date(sessionConflict.lastActivity).toLocaleString()}</li>
            <li><strong>IP Address:</strong> {sessionConflict.ipAddress}</li>
          </ul>
          <p>Do you want to logout from that device and login here?</p>
          <div className="button-group">
            <button 
              onClick={handleForceLogin}
              className="btn btn-primary"
            >
              Yes, Login Here
            </button>
            <button 
              onClick={handleCancelForceLogin}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Login Form */}
      {!sessionConflict && (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      )}
    </div>
  );
};

// ============================================================
// 4. Session Expired Handler (App-wide)
// ============================================================

import { useEffect } from 'react';

export const useSessionExpiredHandler = () => {
  useEffect(() => {
    const handleSessionExpired = (event) => {
      const { code, message } = event.detail;
      
      // Show notification to user
      alert(`Session Expired: ${message}`);
      
      // Could also use a toast notification library
      // toast.error(`Session Expired: ${message}`);
    };

    window.addEventListener('session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, []);
};

// Use in your App component:
// function App() {
//   useSessionExpiredHandler();
//   return <Router>...</Router>;
// }

// ============================================================
// 5. Protected Route Component
// ============================================================

import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Usage:
// <Route path="/dashboard" element={
//   <ProtectedRoute>
//     <Dashboard />
//   </ProtectedRoute>
// } />

// ============================================================
// 6. Session Monitor (Optional)
// ============================================================

/**
 * Hook to monitor session validity
 * Periodically checks if session is still valid
 */
export const useSessionMonitor = (interval = 5 * 60 * 1000) => { // 5 minutes
  useEffect(() => {
    const checkSession = async () => {
      try {
        await api.get('/auth/validate-session');
      } catch (error) {
        // Session invalid - will be handled by interceptor
        console.log('Session check failed:', error);
      }
    };

    // Initial check
    checkSession();

    // Periodic checks
    const intervalId = setInterval(checkSession, interval);

    return () => clearInterval(intervalId);
  }, [interval]);
};

// Use in your authenticated app:
// function Dashboard() {
//   useSessionMonitor();
//   return <div>Dashboard content...</div>;
// }

// ============================================================
// 7. Example Styles (Optional)
// ============================================================

const styles = `
.session-conflict-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  z-index: 1000;
}

.session-conflict-dialog h3 {
  color: #f59e0b;
  margin-bottom: 1rem;
}

.session-conflict-dialog ul {
  list-style: none;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 4px;
  margin: 1rem 0;
}

.session-conflict-dialog li {
  margin: 0.5rem 0;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.alert {
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}
`;

// ============================================================
// 8. Complete Usage Example
// ============================================================

/*
// In your main App.js or App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoginPage, ProtectedRoute, useSessionExpiredHandler } from './auth';

function App() {
  // Monitor session expiration app-wide
  useSessionExpiredHandler();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/clients" element={
          <ProtectedRoute>
            <Clients />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
*/
