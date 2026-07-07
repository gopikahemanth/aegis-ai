import { AgentStep } from "../steps/agent-step.js";

export interface WorkflowTransition {
  onSuccess: AgentStep;

  onFailure?: AgentStep;
}
