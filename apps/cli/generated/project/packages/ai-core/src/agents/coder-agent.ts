import { Agent } from './agent';
import { FailoverProvider } from '../providers/failover';

class CoderAgent extends Agent {
  private provider: FailoverProvider;

  constructor(provider: FailoverProvider) {
    super();
    this.provider = provider;
  }

  async execute(input: string): Promise<any> {
    try {
      const response = await this.provider.chat(input);
      return response;
    } catch (error) {
      console.error(`Error executing coder agent: ${error.message}`);
      throw new Error(`Coder agent failed: ${error.message}`);
    }
  }
}

export { CoderAgent };