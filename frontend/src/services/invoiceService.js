import api from './api';

// Get all invoices
export const getInvoices = async (params = {}) => {
  const response = await api.get('/invoices', { params });
  return response.data;
};

// Get single invoice
export const getInvoice = async (id) => {
  const response = await api.get(`/invoices/${id}`);
  return response.data;
};

// Create invoice
export const createInvoice = async (invoiceData) => {
  const response = await api.post('/invoices', invoiceData);
  return response.data;
};

// Update invoice
export const updateInvoice = async (id, invoiceData) => {
  const response = await api.put(`/invoices/${id}`, invoiceData);
  return response.data;
};

// Delete invoice
export const deleteInvoice = async (id) => {
  const response = await api.delete(`/invoices/${id}`);
  return response.data;
};

// Add order to invoice
export const addOrderToInvoice = async (invoiceId, orderData) => {
  const response = await api.post(`/invoices/${invoiceId}/orders`, orderData);
  return response.data;
};

// Update order in invoice
export const updateOrderInInvoice = async (invoiceId, orderId, orderData) => {
  const response = await api.put(`/invoices/${invoiceId}/orders/${orderId}`, orderData);
  return response.data;
};

// Delete order from invoice
export const deleteOrderFromInvoice = async (invoiceId, orderId) => {
  const response = await api.delete(`/invoices/${invoiceId}/orders/${orderId}`);
  return response.data;
};

// Get invoice statistics
export const getInvoiceStats = async () => {
  const response = await api.get('/invoices/stats');
  return response.data;
};

export default {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  addOrderToInvoice,
  updateOrderInInvoice,
  deleteOrderFromInvoice,
  getInvoiceStats,
};

