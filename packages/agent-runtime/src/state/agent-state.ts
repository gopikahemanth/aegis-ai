import type { AgentStep } from "../steps/agent-step.js";

export interface AgentState {
  request: string;

  projectPath: string;

  framework?: string;

  currentStep: AgentStep;

  reviewPassed: boolean;

  buildPassed: boolean;

  testPassed: boolean;

  deployCompleted: boolean;

  healAttempts: number;

  completed: boolean;
}
