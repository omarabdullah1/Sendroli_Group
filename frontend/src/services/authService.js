import api from './api';

const authService = {
  // Login user
  login: async (username, password) => {
    console.log('🚀 Frontend: Attempting login with:', { username, password: '***' });
    console.log('🌐 API URL:', import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

    try {
      // Send login request
      const response = await api.post('/auth/login', { username, password });
      console.log('✅ Frontend: Login response received:', response.data);

      if (response.data.success) {
        const { token, ...userData } = response.data.data;

        // Store token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('💾 Frontend: User data stored in localStorage');
      }

      return response.data;
    } catch (error) {
      // Handle network or server errors
      if (!error.response) {
        console.error('❌ Frontend: Network or CORS error', error);
      } else {
        console.error('❌ Frontend: Login error', error.response.data);
      }
      throw error;
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('🔓 Frontend: User logged out');
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },

  // Get current user from server
  getMe: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Error fetching current user', error.response?.data || error);
      throw error;
    }
  },
};

export default authService;
