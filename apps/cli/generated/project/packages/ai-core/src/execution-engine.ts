import { ExecutionEngine } from './execution-engine';
import { Orchestrator } from '../agent/orchestrator';

class ExecutionEngine {
  private orchestrator: Orchestrator;

  constructor(orchestrator: Orchestrator) {
    this.orchestrator = orchestrator;
  }

  async execute(input: string): Promise<any> {
    try {
      const response = await this.orchestrator.generateApplication(input);
      return response;
    } catch (error) {
      console.error(`Error executing execution engine: ${error.message}`);
      throw new Error(`Execution engine failed: ${error.message}`);
    }
  }
}

export { ExecutionEngine };