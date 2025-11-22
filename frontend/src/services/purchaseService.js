import api from './api';

export const purchaseService = {
  // Get all purchases
  getAll: (params = {}) => api.get('/purchases', { params }),
  
  // Get purchase by ID
  getById: (id) => api.get(`/purchases/${id}`),
  
  // Create new purchase
  create: (data) => api.post('/purchases', data),
  
  // Update purchase
  update: (id, data) => api.put(`/purchases/${id}`, data),
  
  // Delete purchase
  delete: (id) => api.delete(`/purchases/${id}`),
  
  // Receive purchase
  receive: (id, data) => api.post(`/purchases/${id}/receive`, data)
};