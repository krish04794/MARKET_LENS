import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ml_user', JSON.stringify(user));
      localStorage.setItem('ml_token', token);
    }
    set({ user, token });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ml_user');
      localStorage.removeItem('ml_token');
    }
    set({ user: null, token: null });
  },
  initialize: () => {
    if (typeof window !== 'undefined') {
      const uStr = localStorage.getItem('ml_user');
      const tStr = localStorage.getItem('ml_token');
      if (uStr && tStr) {
        try {
          set({ user: JSON.parse(uStr), token: tStr });
        } catch (e) {
          localStorage.removeItem('ml_user');
          localStorage.removeItem('ml_token');
        }
      }
    }
  }
}));
