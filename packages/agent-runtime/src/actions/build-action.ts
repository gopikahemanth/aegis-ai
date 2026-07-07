import type { AgentState } from "../state/agent-state.js";
import type { ActionResult } from "./action-result.js";

export class BuildAction {
  async execute(
    state: AgentState,
  ): Promise<ActionResult> {

    console.log(
      "Executing BUILD",
    );

    return {
      success: true,

      state: {
        ...state,
        buildPassed: true,
      },
    };
  }
}
