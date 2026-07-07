import type { AgentState } from "../state/agent-state.js";
import { AgentStep } from "../steps/agent-step.js";

export class NextStepResolver {
  resolve(
  state: AgentState,
): AgentStep {

  if (state.completed) {
    return AgentStep.FINISHED;
  }

  return state.currentStep;
}
}
