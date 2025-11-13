import api from './api';

const orderService = {
  // Get all orders
  getOrders: async (params = {}) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  // Get single order
  getOrder: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  // Create order
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  // Update order
  updateOrder: async (id, orderData) => {
    const response = await api.put(`/orders/${id}`, orderData);
    return response.data;
  },

  // Delete order
  deleteOrder: async (id) => {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  },

  // Get financial statistics
  getFinancialStats: async () => {
    const response = await api.get('/orders/stats/financial');
    return response.data;
  },
};

export default orderService;
