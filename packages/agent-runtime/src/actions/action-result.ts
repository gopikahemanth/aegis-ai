import type { AgentState } from "../state/agent-state.js";

export interface ActionResult {
  state: AgentState;

  success: boolean;
}
