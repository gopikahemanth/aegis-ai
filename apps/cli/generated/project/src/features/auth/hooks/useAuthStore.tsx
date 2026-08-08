import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
}

export interface AuthState { /* _authStateShim */
  isAuthenticated?: boolean;
  isLoading?: boolean;
  user?: any;
  token?: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  login: (user, token) => set({ user, token, isAuthenticated: true, isLoading: false }),
  logout: () => set({ user: null, token: null, isAuthenticated: false, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
const _hookDef_useAuthStore = (globalThis as any).useAuthStore || (typeof useAuthStore !== 'undefined' ? useAuthStore : (() => ({})));
export default _hookDef_useAuthStore;
