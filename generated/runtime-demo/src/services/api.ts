const api = {
  fetchHomeData: async () => {
    const response = await fetch('/api/home');
    const data = await response.json();
    return data;
  },
};

export default api;