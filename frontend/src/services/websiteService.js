import api from './api';

const websiteService = {
  // Get website settings
  getSettings: async () => {
    try {
      const response = await api.get('/website/settings');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update website settings (Admin only)
  updateSettings: async (settings) => {
    try {
      const response = await api.put('/website/settings', settings);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Add service
  addService: async (service) => {
    try {
      const response = await api.post('/website/services', service);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update service
  updateService: async (serviceId, service) => {
    try {
      const response = await api.put(`/website/services/${serviceId}`, service);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete service
  deleteService: async (serviceId) => {
    try {
      const response = await api.delete(`/website/services/${serviceId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Add portfolio item
  addPortfolioItem: async (item) => {
    try {
      const response = await api.post('/website/portfolio', item);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete portfolio item
  deletePortfolioItem: async (itemId) => {
    try {
      const response = await api.delete(`/website/portfolio/${itemId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Upload image
  uploadImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await api.post('/website/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      // Handle specific error cases
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 404) {
          throw new Error('Upload endpoint not found. Please contact support.');
        } else if (status === 401) {
          throw new Error('Authentication required. Please login as admin.');
        } else if (status === 403) {
          throw new Error('Access denied. Only admins can upload images.');
        } else if (data && typeof data === 'object' && data.message) {
          throw new Error(data.message);
        } else if (typeof data === 'string' && data.includes('Cannot POST')) {
          throw new Error('Upload service unavailable. Please try again later.');
        }
      }
      throw new Error(error.message || 'Failed to upload image');
    }
  },

  // Delete uploaded image
  deleteImage: async (filename) => {
    try {
      const response = await api.delete(`/website/upload/${filename}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default websiteService;

