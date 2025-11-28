import api from './api';

const clientService = {
  // Get all clients
  getClients: async (params = {}) => {
    const response = await api.get('/clients', { params });
    return response.data;
  },

  // Get single client
  getClient: async (id) => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },

  // Create client
  createClient: async (clientData) => {
    const response = await api.post('/clients', clientData);
    return response.data;
  },

  // Update client
  updateClient: async (id, clientData) => {
    const response = await api.put(`/clients/${id}`, clientData);
    return response.data;
  },

  // Delete client
  deleteClient: async (id) => {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  },

  // Get client financial report
  getClientReport: async (id) => {
    const response = await api.get(`/clients/${id}/report`);
    return response.data;
  },
};

export default clientService;
