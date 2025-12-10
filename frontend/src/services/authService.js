import api from './api';

const authService = {
  // Login user with single device restriction
  // Password is optional for phone-only login (client role)
  login: async (username, password = null, force = false) => {
    // Normalize the password input: avoid sending the string 'not provided' as a real password
    if (password === 'not provided') {
      password = null;
    }

    console.log('🚀 Frontend: Attempting login with:', { 
      username, 
      hasPassword: !!password,
      loginType: /^[\d\s\-\+\(\)]+$/.test(username) ? 'phone' : username.includes('@') ? 'email' : 'username',
      force 
    });
    console.log('🌐 API URL:', import.meta.env.VITE_API_URL || 'https://backend-o6t3c3xxs-oos-projects-e7124c64.vercel.app/api');

    try {
      const loginData = { username, force };
      
      // Only include password if provided (phone-only login doesn't need it)
      if (password) {
        loginData.password = password;
      }
      
      // Log the exact payload that will be sent (without revealing a raw password)
      const loggedPayload = { ...loginData };
      if (loggedPayload.password) loggedPayload.password = '***';
      console.log('📤 Frontend: Sending request to /auth/login with:', loggedPayload);
      
      // Send login request
      const response = await api.post('/auth/login', loginData);
      console.log('📥 Frontend: Raw response:', response);
      console.log('✅ Frontend: Login response received:', response.data);

      if (response.data.success || response.data.status === 'force_login_success') {
        console.log('💾 Frontend: Processing successful login response');
        
        // Extract token and user data properly
        const token = response.data.token;
        const user = response.data.user || response.data.data;
        
        if (!token || !user) {
          console.error('❌ Missing token or user data in response:', response.data);
          throw new Error('Invalid login response structure');
        }

        console.log('🧹 Frontend: Clearing old stored data');
        // Clear any existing stored data first (important for force login)
        authService.clearStoredAuth();

        console.log('💾 Frontend: Storing new token and user data');
        // Store new token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        console.log('🔐 Frontend: Login token stored');
        console.log('👤 Frontend: User stored:', user);
        console.log('📊 Frontend: Session version:', response.data.sessionInfo?.sessionVersion);
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

  // Register new user (admin only)
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Register new client (passwordless - phone-based authentication)
  registerClient: async (userData) => {
    console.log('📝 Frontend: Registering client with data:', {
      ...userData,
      password: userData.password ? '***' : 'not provided (passwordless)',
      confirmPassword: userData.confirmPassword ? '***' : 'not provided'
    });
    
    try {
      const response = await api.post('/auth/register-client', userData);
      console.log('✅ Frontend: Client registration successful:', response.data);
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Client registration error:', error.response?.data || error);
      throw error;
    }
  },

  // Check if phone exists and belongs to a client
  checkPhone: async (phone) => {
    try {
      const response = await api.post('/auth/check-phone', { phone });
      console.log('🔎 Frontend: checkPhone response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: checkPhone error', error.response?.data || error);
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
