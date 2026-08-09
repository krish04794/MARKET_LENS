import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('ml_user') || 'null'),
  token: localStorage.getItem('ml_token') || null,
  login: (user, token) => {
    localStorage.setItem('ml_user', JSON.stringify(user));
    localStorage.setItem('ml_token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('ml_user');
    localStorage.removeItem('ml_token');
    set({ user: null, token: null });
  },
}));

export default useAuthStore;
