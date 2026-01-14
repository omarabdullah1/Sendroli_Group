import api from './api';

const BASE_URL = '/store';

// Brands
export const getBrands = () => api.get(`${BASE_URL}/brands`);
export const createBrand = (data) => api.post(`${BASE_URL}/brands`, data);

// Models
export const getModels = (brandId = '') => api.get(`${BASE_URL}/models${brandId ? `?brandId=${brandId}` : ''}`);
export const createModel = (data) => api.post(`${BASE_URL}/models`, data);

// Categories
export const getCategories = () => api.get(`${BASE_URL}/categories`);
export const createCategory = (data) => api.post(`${BASE_URL}/categories`, data);

// Products
export const getProducts = (params) => api.get(`${BASE_URL}/products`, { params });
export const createProduct = (data) => api.post(`${BASE_URL}/products`, data);

// Orders
export const getStoreOrders = () => api.get(`${BASE_URL}/orders`); // Admin
export const updateStoreOrderStatus = (id, status) => api.put(`${BASE_URL}/orders/${id}/status`, { status });
