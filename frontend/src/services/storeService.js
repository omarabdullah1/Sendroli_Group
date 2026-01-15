import api from './api';

const BASE_URL = '/store';

// Brands
export const getBrands = () => api.get(`${BASE_URL}/brands`);
export const createBrand = (data) => api.post(`${BASE_URL}/brands`, data, { headers: { 'Content-Type': undefined } });
export const updateBrand = (id, data) => api.put(`${BASE_URL}/brands/${id}`, data, { headers: { 'Content-Type': undefined } });
export const deleteBrand = (id) => api.delete(`${BASE_URL}/brands/${id}`);

// Models
export const getModels = (brandId = '') => api.get(`${BASE_URL}/models${brandId ? `?brandId=${brandId}` : ''}`);
export const createModel = (data) => api.post(`${BASE_URL}/models`, data);
export const updateModel = (id, data) => api.put(`${BASE_URL}/models/${id}`, data);
export const deleteModel = (id) => api.delete(`${BASE_URL}/models/${id}`);

// Categories
export const getCategories = () => api.get(`${BASE_URL}/categories`);
export const createCategory = (data) => api.post(`${BASE_URL}/categories`, data, { headers: { 'Content-Type': undefined } });
export const updateCategory = (id, data) => api.put(`${BASE_URL}/categories/${id}`, data, { headers: { 'Content-Type': undefined } });
export const deleteCategory = (id) => api.delete(`${BASE_URL}/categories/${id}`);

// Shipping
export const getShipping = () => api.get(`${BASE_URL}/shipping`);
export const createShipping = (data) => api.post(`${BASE_URL}/shipping`, data);
export const updateShipping = (id, data) => api.put(`${BASE_URL}/shipping/${id}`, data);
export const deleteShipping = (id) => api.delete(`${BASE_URL}/shipping/${id}`);

// Customers
export const getStoreCustomers = () => api.get(`${BASE_URL}/customers`);

// Products
export const getProducts = (params) => api.get(`${BASE_URL}/products`, { params });
export const createProduct = (data) => api.post(`${BASE_URL}/products`, data, { headers: { 'Content-Type': undefined } });

// Orders
export const getStoreOrders = () => api.get(`${BASE_URL}/orders`); // Admin
export const updateStoreOrderStatus = (id, status) => api.put(`${BASE_URL}/orders/${id}/status`, { status });

