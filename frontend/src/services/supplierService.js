import api from './api';

export const supplierService = {
  // Get all suppliers
  getAll: (params = {}) => api.get('/suppliers', { params }),
  
  // Get supplier by ID
  getById: (id) => api.get(`/suppliers/${id}`),
  
  // Create new supplier
  create: (data) => api.post('/suppliers', data),
  
  // Update supplier
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  
  // Delete supplier
  delete: (id) => api.delete(`/suppliers/${id}`)
};