import axios from 'axios';

const API_URL = 'https://foodflow-web-app-production.up.railway.app/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
};

// Package services
export const packageService = {
  getAll: () => api.get('/packages'),
  getById: (id) => api.get(`/packages/${id}`),
  create: (data) => api.post('/packages', data),
  update: (id, data) => api.put(`/packages/${id}`, data),
  delete: (id) => api.delete(`/packages/${id}`),
};

// Order services
export const orderService = {
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, status),
  cancel: (id) => api.delete(`/orders/${id}`),
};

// Ingredient services
export const ingredientService = {
  getAll: () => api.get('/ingredients'),
  getLowStock: () => api.get('/ingredients/low-stock'),
  getById: (id) => api.get(`/ingredients/${id}`),
  create: (data) => api.post('/ingredients', data),
  update: (id, data) => api.put(`/ingredients/${id}`, data),
  adjustStock: (id, data) => api.post(`/ingredients/${id}/adjust`, data),
  getTransactions: (id) => api.get(`/ingredients/${id}/transactions`),
  delete: (id) => api.delete(`/ingredients/${id}`),
};

// Cutlery services
export const cutleryService = {
  getAll: () => api.get('/cutlery'),
  getById: (id) => api.get(`/cutlery/${id}`),
  create: (data) => api.post('/cutlery', data),
  update: (id, data) => api.put(`/cutlery/${id}`, data),
  reportDamage: (id, data) => api.patch(`/cutlery/${id}/damage`, data),
  delete: (id) => api.delete(`/cutlery/${id}`),
};

// Dashboard services
export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getTrends: (period) => api.get(`/dashboard/trends?period=${period}`),
  getAlerts: () => api.get('/dashboard/alerts'),
};

export default api;
