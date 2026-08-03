import { Command } from './command';
import { ExecutionEngine } from '../agent-runtime/src/execution-engine';

class CreateCommand extends Command {
  private executionEngine: ExecutionEngine;

  constructor(executionEngine: ExecutionEngine) {
    super();
    this.executionEngine = executionEngine;
  }

  async execute(input: string): Promise<any> {
    try {
      const response = await this.executionEngine.execute(input);
      return response;
    } catch (error) {
      console.error(`Error executing create command: ${error.message}`);
      throw new Error(`Create command failed: ${error.message}`);
    }
  }
}

export { CreateCommand };