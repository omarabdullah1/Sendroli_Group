import api from './api';

const authService = {
  // Login user with single device restriction
  login: async (username, password, force = false) => {
    console.log('🚀 Frontend: Attempting login with:', { username, password: '***', force });
    console.log('🌐 API URL:', import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

    try {
      console.log('📤 Frontend: Sending request to /auth/login with:', { username, password: '***', force });
      // Send login request
      const response = await api.post('/auth/login', { username, password, force });
      console.log('📥 Frontend: Raw response:', response);
      console.log('✅ Frontend: Login response received:', response.data);

      if (response.data.success || response.data.status === 'force_login_success') {
        console.log('💾 Frontend: Processing successful login response');
        // Handle different response structures for regular vs force login
        const userData = response.data.data || response.data;
        const token = response.data.token || userData.token;

        console.log('🧹 Frontend: Clearing old stored data');
        // Clear any existing stored data first (important for force login)
        authService.clearStoredAuth();

        console.log('💾 Frontend: Storing new token and user data');
        // Store new token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('🔐 Frontend: Login token stored');
        console.log('📊 Frontend: Session version:', userData.sessionInfo?.sessionVersion);
      } else {
        console.log('⚠️ Frontend: Login response not successful:', response.data);
      }

      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Login error:', error);
      // Handle network or server errors
      if (!error.response) {
        console.error('❌ Frontend: Network or CORS error', error);
      } else {
        console.error('❌ Frontend: Login error response:', error.response.data);
      }
      throw error;
    }
  },

  // Logout user and clear active token on server
  logout: async () => {
    try {
      console.log('🔓 Frontend: Attempting logout...');
      await api.post('/auth/logout');
      console.log('✅ Frontend: Server logout successful');
    } catch (error) {
      console.error('❌ Frontend: Server logout error', error.response?.data || error);
      // Don't throw error, allow local logout to proceed
    }
    
    // Always clear local storage
    authService.clearStoredAuth();
  },

  // Clear stored authentication data
  clearStoredAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('🧹 Frontend: Stored auth data cleared');
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },

  // Get current user from server with single login validation
  getMe: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Error fetching current user', error.response?.data || error);
      throw error;
    }
  },

  // Check if user is logged in
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Validate current session
  validateSession: async () => {
    try {
      const response = await api.get('/auth/validate-session');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Error validating session', error.response?.data || error);
      throw error;
    }
  },
};

export default authService;
