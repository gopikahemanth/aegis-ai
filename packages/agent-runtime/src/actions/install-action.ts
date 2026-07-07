import type { AgentState } from "../state/agent-state.js";
import type { ActionResult } from "./action-result.js";

export class InstallAction {
  async execute(
    state: AgentState,
  ): Promise<ActionResult> {

    console.log(
      "Executing INSTALL",
    );

    return {
      success: true,
      state,
    };
  }
}
