import axios from 'axios';

// Base URL - Use environment variable or fallback to latest deployment
const API_URL = import.meta.env.VITE_API_URL || 'https://backend-4jprecu3t-oos-projects-e7124c64.vercel.app/api';

// Debug: Log the API URL being used
console.log('🔧 API Base URL:', API_URL);
console.log('🔧 Environment:', import.meta.env.MODE);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // enable if you use cookies for auth
});

// Request interceptor to add token
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

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Unauthorized - clear local storage and redirect to login
    // But only if we're not on a public page
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const publicRoutes = ['/', '/login', '/unauthorized'];
      const isPublicRoute = publicRoutes.includes(currentPath);
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect to login if we're on a protected route
      if (!isPublicRoute && currentPath !== '/login') {
        window.location.href = '/login';
      }
    }

    // Log network errors for debugging
    if (!error.response) {
      console.error('❌ Network Error:', error);
    }

    return Promise.reject(error);
  }
);

export default api;
