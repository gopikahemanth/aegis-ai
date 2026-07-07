import type { AgentState } from "../state/agent-state.js";
import type { Orchestrator } from "@aegis/ai-core";
import type { ActionResult } from "./action-result.js";
export class GenerateAction {
  constructor(
    private readonly orchestrator: Orchestrator,
  ) {}

async execute(
  state: AgentState,
): Promise<ActionResult> {

    console.log(
      "Executing GENERATE",
    );

    const result =
  await this.orchestrator.generateCode(
    state.request,
    state.projectPath,
  );

return {
  success: true,

  state: {
    ...state,
    framework: result.framework,
    generatedResponse: result.response,
  },
};
  }
}
