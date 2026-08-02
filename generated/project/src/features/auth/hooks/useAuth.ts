import { useState, useCallback } from 'react';
import { User } from '../../../entities/User';
import { authService } from '../services/authService';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());

  const login = useCallback(async (email: string, pass: string) => {
    const u = await authService.login(email, pass);
    setUser(u);
  }, []);

  const register = useCallback(async (email: string, pass: string, name: string) => {
    const u = await authService.register(email, pass, name);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (userId: string, data: Partial<User>) => {
    const u = await authService.updateProfile(userId, data);
    setUser(u);
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
  };
}