import type { AgentState } from "../state/agent-state.js";
import { AgentStep } from "../steps/agent-step.js";

export type AgentAction =
  (state: AgentState) => Promise<AgentState>;

export class AgentExecutor {
  private readonly actions =
    new Map<AgentStep, AgentAction>();

  register(
    step: AgentStep,
    action: AgentAction,
  ) {
    this.actions.set(
      step,
      action,
    );
  }

  async execute(
    step: AgentStep,
    state: AgentState,
  ): Promise<AgentState> {
    const action =
      this.actions.get(step);

    if (!action) {
      throw new Error(
        `No action registered for ${step}`,
      );
    }

    return action(state);
  }
}
