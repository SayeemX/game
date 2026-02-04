import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || '/api';

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
  play: (tier) => api.post('/spin/play', { tier }),
  verify: (hash) => api.get(`/spin/verify/${hash}`),
  updateClientSeed: (clientSeed) => api.post('/spin/update-client-seed', { clientSeed }),
  rotateSeed: () => api.post('/spin/rotate-seed'),
  verifyResult: (data) => api.post('/spin/verify', data)
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

export const shopAPI = {
  getItems: () => api.get('/shop/items'),
  buyItem: (itemId) => api.post('/shop/buy', { itemId }),
  buyAmmo: (itemKey) => api.post('/shop/buy', { itemKey, type: 'ammo' }),
  equipItem: (itemKey) => api.post('/shop/equip', { itemKey }),
  buySpins: (amount, tier) => api.post('/shop/buy-spins', { amount, tier })
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  updateBalance: (data) => api.post('/admin/users/update-balance', data),
  getCodes: () => api.get('/admin/redeem-codes'),
  createCode: (data) => api.post('/admin/redeem-codes', data),
  getSpinConfig: () => api.get('/admin/spin-config'),
  updateSpinConfig: (data) => api.post('/admin/spin-config', data),
  getBirdConfig: () => api.get('/admin/bird-config'),
  updateBirdConfig: (data) => api.post('/admin/bird-config', data),
  getPaymentConfig: () => api.get('/admin/payment-config'),
  updatePaymentConfig: (data) => api.post('/admin/payment-config', data),
  getPendingTransactions: () => api.get('/admin/transactions/pending'),
  processTransaction: (data) => api.post('/admin/transactions/process', data),
  getCurrencyConfigs: () => api.get('/admin/currency-config'),
  updateCurrencyConfig: (data) => api.post('/admin/currency-config', data),
  // Shop management
  getShopItems: () => api.get('/admin/shop-items'),
  createShopItem: (data) => api.post('/admin/shop-items', data),
  updateShopItem: (id, data) => api.put(`/admin/shop-items/${id}`, data),
  deleteShopItem: (id) => api.delete(`/admin/shop-items/${id}`)
};

export default api;
