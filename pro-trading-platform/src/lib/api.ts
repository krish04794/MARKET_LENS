import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5001/api' });

api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('ml_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
};

export const marketAPI = {
  getAssets: (type: string) => api.get('/market/assets', { params: { type } }),
  getOHLCV: (symbol: string) => api.get(`/market/ohlcv/${symbol}`),
  getIndicators: (symbol: string) => api.get(`/market/indicators/${symbol}`),
  getQuote: (symbol: string) => api.get(`/market/quote/${symbol}`),
};

export const screenerAPI = {
  run: (filters: any) => api.post('/screener/run', filters),
  getPresets: () => api.get('/screener/presets'),
  savePreset: (name: string, filters: any) => api.post('/screener/presets', { name, filters }),
};

export const riskAPI = {
  get: (symbol: string) => api.get(`/risk/${symbol}`),
};

export const aiAPI = {
  query: (query: string) => api.post('/ai/query', { query }),
  insight: (symbol: string) => api.get(`/ai/insight/${symbol}`),
  analyze: (symbol: string) => api.get(`/ai/analyze/${symbol}`),
};

export const watchlistAPI = {
  get: () => api.get('/watchlist'),
  add: (symbol: string) => api.post(`/watchlist/${symbol}`),
  remove: (symbol: string) => api.delete(`/watchlist/${symbol}`),
};

export default api;
