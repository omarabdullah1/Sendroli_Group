import axios from 'axios';

// Vite proxies /api to backend
const api = axios.create({
    baseURL: '/api/store',
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
