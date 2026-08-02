export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  DEFAULT_AI_PROVIDER: import.meta.env.VITE_DEFAULT_AI_PROVIDER || 'gemini',
};