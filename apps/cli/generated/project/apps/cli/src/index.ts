import { CreateCommand } from './commands/create';
import { ExecutionEngine } from '../agent-runtime/src/execution-engine';

class CLI {
  private createCommand: CreateCommand;
  private executionEngine: ExecutionEngine;

  constructor(createCommand: CreateCommand, executionEngine: ExecutionEngine) {
    this.createCommand = createCommand;
    this.executionEngine = executionEngine;
  }

  async main(input: string): Promise<any> {
    try {
      const response = await this.createCommand.execute(input);
      return response;
    } catch (error) {
      console.error(`Error executing CLI: ${error.message}`);
      throw new Error(`CLI execution failed: ${error.message}`);
    }
  }
}

export { CLI };