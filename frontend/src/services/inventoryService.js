import api from './api';

export const inventoryService = {
  // Get daily count
  getDailyCount: (date) => api.get(`/inventory/daily/${date || ''}`),
  
  // Submit daily count
  submitDailyCount: (data) => api.post('/inventory/daily', data),
  
  // Get inventory history for a material
  getHistory: (materialId, params = {}) => api.get(`/inventory/${materialId}/history`, { params }),
  
  // Get wastage report
  getWastageReport: (params = {}) => api.get('/inventory/wastage', { params }),
  
  // Record wastage
  recordWastage: (data) => api.post('/inventory/wastage', data),
  
  // Withdraw material (one piece)
  withdrawMaterial: (data) => api.post('/inventory/withdraw', data),
  
  // Get withdrawals history
  getWithdrawals: (params = {}) => api.get('/inventory/withdrawals', { params })
};