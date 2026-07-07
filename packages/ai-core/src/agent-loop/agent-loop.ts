import { AgentStep } from "./agent-step.js";
import type { AgentState } from "./agent-state.js";

export class AgentLoop {
  next(
    state: AgentState,
  ): AgentStep {

    if (state.completed) {
      return AgentStep.FINISHED;
    }

    if (
      state.generatedFiles.length === 0
    ) {
      return AgentStep.GENERATE;
    }

    if (!state.review) {
      return AgentStep.REVIEW;
    }

    if (!state.build) {
      return AgentStep.BUILD;
    }

    if (!state.build.success) {
      return AgentStep.HEAL;
    }

    return AgentStep.FINISHED;
  }
}
