import api from './api';

const dashboardService = {
  getSummary: () => api.get('/dashboard/summary'),
  // other dashboard-specific endpoints can be added here
};

export default dashboardService;
