import axios from 'axios';

const api = axios.create({
  baseURL: 'https://example.com/api',
});

const login = async (username: string, password: string) => {
  try {
    const response = await api.post('/login', { username, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export { login };