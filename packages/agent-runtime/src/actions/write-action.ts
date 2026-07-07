import type { AgentState } from "../state/agent-state.js";
import type { ActionResult } from "./action-result.js";

export class WriteAction {
  async execute(
    state: AgentState,
  ): Promise<ActionResult> {

    console.log(
      "Executing WRITE",
    );

    return {
      success: true,

      state,
    };
  }
}
