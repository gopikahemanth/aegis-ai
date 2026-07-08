import type { AgentStep } from "../steps/agent-step.js";

export interface AgentState {
  request: string;

  projectPath: string;

  framework?: string;

  generatedResponse?: string;

  currentStep: AgentStep;

  reviewPassed: boolean;

  buildPassed: boolean;

  buildStdout?: string;

  buildStderr?: string;

  testPassed: boolean;

  deployCompleted: boolean;

  healAttempts: number;

  completed: boolean;
}
