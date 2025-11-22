import api from './api';

export const materialService = {
  // Get all materials
  getAll: (params = {}) => api.get('/materials', { params }),
  
  // Get material by ID
  getById: (id) => api.get(`/materials/${id}`),
  
  // Create new material
  create: (data) => api.post('/materials', data),
  
  // Update material
  update: (id, data) => api.put(`/materials/${id}`, data),
  
  // Delete material
  delete: (id) => api.delete(`/materials/${id}`),
  
  // Get low stock materials
  getLowStock: () => api.get('/materials/low-stock'),
  
  // Update stock
  updateStock: (data) => api.post('/materials/stock/update', data)
};