import type { AgentState } from "../state/agent-state.js";
import { AgentStep } from "../steps/agent-step.js";
export class ReviewAction {
  async execute(
    state: AgentState,
  ): Promise<AgentState> {

    console.log(
      "Executing REVIEW",
    );

   return {
  ...state,
  reviewPassed: true,
  completed: true,
  currentStep: AgentStep.FINISHED,
};
  }
}
