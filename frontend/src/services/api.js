import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('ml_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

export const marketAPI = {
  getAssets: (type) => api.get('/market/assets', { params: { type } }),
  getOHLCV: (symbol) => api.get(`/market/ohlcv/${symbol}`),
  getIndicators: (symbol) => api.get(`/market/indicators/${symbol}`),
  getQuote: (symbol) => api.get(`/market/quote/${symbol}`),
};

export const screenerAPI = {
  run: (filters) => api.post('/screener/run', filters),
  getPresets: () => api.get('/screener/presets'),
  savePreset: (name, filters) => api.post('/screener/presets', { name, filters }),
};

export const riskAPI = {
  get: (symbol) => api.get(`/risk/${symbol}`),
};

export const aiAPI = {
  query: (query) => api.post('/ai/query', { query }),
  insight: (symbol) => api.get(`/ai/insight/${symbol}`),
};

export const watchlistAPI = {
  get: () => api.get('/watchlist'),
  add: (symbol) => api.post(`/watchlist/${symbol}`),
  remove: (symbol) => api.delete(`/watchlist/${symbol}`),
};

export default api;
