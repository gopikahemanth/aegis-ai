import type { AgentState } from "../state/agent-state.js";
import { AgentStep } from "../steps/agent-step.js";
import type { ActionResult } from "../actions/action-result.js";

export type AgentAction =
  (state: AgentState) => Promise<ActionResult>;

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
  ): Promise<ActionResult> {

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
