import api from './api';

export const orderService = {
  getOrders: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/orders?${params}`);
    return response.data;
  },

  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  updateOrder: async (id, orderData) => {
    const response = await api.put(`/orders/${id}`, orderData);
    return response.data;
  },

  deleteOrder: async (id) => {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  },

  getOrderStats: async () => {
    const response = await api.get('/orders/stats');
    return response.data;
  },
};
