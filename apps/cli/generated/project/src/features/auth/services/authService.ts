import axios from 'axios';
import { LoginCredentials, RegisterCredentials } from '../types';

const api = axios.create({ baseURL: '/api' });

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  },
  register: async (credentials: RegisterCredentials) => {
    const { data } = await api.post('/auth/register', credentials);
    return data;
  }
};

export { api };
export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});
