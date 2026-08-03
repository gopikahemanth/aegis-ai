import { Provider } from './provider';
import axios from 'axios';

class FailoverProvider {
  private providers: Provider[];
  private axiosInstance: axios.AxiosInstance;

  constructor(providers: Provider[]) {
    this.providers = providers;
    this.axiosInstance = axios.create({
      timeout: 10000,
      retries: 5,
      retryDelay: 1000,
    });
  }

  async chat(input: string): Promise<any> {
    for (const provider of this.providers) {
      try {
        const response = await this.axiosInstance.get(provider.url, {
          params: { input },
          headers: {
            'User-Agent': 'Aegis AI',
          },
        });
        return response.data;
      } catch (error) {
        console.error(`Error fetching from ${provider.url}: ${error.message}`);
      }
    }
    throw new Error('All providers failed');
  }
}

export { FailoverProvider };