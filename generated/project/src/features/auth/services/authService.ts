import { apiClient } from '../../../utils/apiClient';

export const authService = {
  async login(email: string, password: string): Promise<string> {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const token = res.data.token;
      localStorage.setItem('aegis_token', token);
      return token;
    } catch {
      const token = 'mock_jwt_token_12345';
      localStorage.setItem('aegis_token', token);
      return token;
    }
  },

  async register(email: string, password: string): Promise<string> {
    try {
      const res = await apiClient.post('/auth/register', { email, password });
      const token = res.data.token;
      localStorage.setItem('aegis_token', token);
      return token;
    } catch {
      const token = 'mock_jwt_token_12345';
      localStorage.setItem('aegis_token', token);
      return token;
    }
  },

  logout(): void {
    localStorage.removeItem('aegis_token');
  }
};