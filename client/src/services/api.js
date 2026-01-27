import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Request interceptor
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

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me')
};

export const spinAPI = {
  initialize: () => api.post('/spin/initialize'),
  play: (bet) => api.post('/spin/play', { bet }),
  verify: (hash) => api.get(`/spin/verify/${hash}`)
};

export const gamesAPI = {
  bird: {
    start: (level) => api.post('/games/bird/start', { level }),
    shoot: (gameId, x, y) => api.post('/games/bird/shoot', { gameId, x, y }),
    end: (gameId) => api.post('/games/bird/end', { gameId }),
    status: (gameId) => api.get(`/games/bird/status/${gameId}`)
  }
};

export const paymentAPI = {
  deposit: (data) => api.post('/payment/deposit', data),
  withdraw: (data) => api.post('/payment/withdraw', data),
  recharge: (data) => api.post('/payment/recharge', data),
  history: () => api.get('/payment/history'),
  methods: () => api.get('/payment/methods')
};

export const redeemAPI = {
  redeem: (code) => api.post('/redeem', { code })
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  updateBalance: (data) => api.post('/admin/users/update-balance', data),
  getCodes: () => api.get('/admin/redeem-codes'),
  createCode: (data) => api.post('/admin/redeem-codes', data),
  getSpinConfig: () => api.get('/admin/spin-config'),
  updateSpinConfig: (data) => api.post('/admin/spin-config', data)
};

export default api;
