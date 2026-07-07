import type { AgentState } from "../state/agent-state.js";
import type { ActionResult } from "./action-result.js";

export class ReviewAction {
  async execute(
    state: AgentState,
  ): Promise<ActionResult> {

    console.log(
      "Executing REVIEW",
    );

    return {
      success: true,

      state: {
        ...state,
        reviewPassed: true,
      },
    };
  }
}
