import api from './api';

const authService = {
  // Login user with single device restriction
  login: async (username, password) => {
    console.log('🚀 Frontend: Attempting single login with:', { username, password: '***' });
    console.log('🌐 API URL:', import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

    try {
      // Send login request
      const response = await api.post('/auth/login', { username, password });
      console.log('✅ Frontend: Single login response received:', response.data);

      if (response.data.success) {
        const { token, ...userData } = response.data.data;

        // Store token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('💾 Frontend: User data stored in localStorage');
        console.log('🔐 Frontend: Single login token stored');
      }

      return response.data;
    } catch (error) {
      // Handle network or server errors
      if (!error.response) {
        console.error('❌ Frontend: Network or CORS error', error);
      } else {
        console.error('❌ Frontend: Single login error', error.response.data);
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

  // Get user profile with session info
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Error fetching user profile', error.response?.data || error);
      throw error;
    }
  },

  // Check if user is logged in
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Get stored token
  getToken: () => {
    return localStorage.getItem('token');
  }
};

export default authService;
