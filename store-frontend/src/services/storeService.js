import api from './api';

export const getBrands = () => api.get('/brands');
export const getModels = (brandId) => api.get(`/models${brandId ? `?brandId=${brandId}` : ''}`);
export const getCategories = () => api.get('/categories');
export const getProducts = (params) => api.get('/products', { params });
export const getProductById = (id) => api.get(`/products/${id}`);
export const placeOrder = (data) => api.post('/orders', data);
