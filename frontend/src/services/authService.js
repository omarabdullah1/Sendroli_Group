import api from './api';

const authService = {
  // Login user
  login: async (username, password) => {
    console.log('🚀 Frontend: Attempting login with:', { username, password: '***' });
    console.log('🌐 API URL:', process.env.REACT_APP_API_URL || 'http://localhost:5000/api');
    
    try {
      const response = await api.post('/auth/login', { username, password });
      console.log('✅ Frontend: Login response received:', response.data);
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
        console.log('💾 Frontend: User data stored in localStorage');
      }
      return response.data;
    } catch (error) {
      console.log('❌ Frontend: Login error:', error);
      console.log('Error response:', error.response?.data);
      throw error;
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },

  // Get current user from server
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export default authService;
