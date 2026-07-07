import type { AgentState } from "../state/agent-state.js";
import { AgentStep } from "../steps/agent-step.js";
import type { Orchestrator } from "@aegis/ai-core";

export class GenerateAction {
  constructor(
    private readonly orchestrator: Orchestrator,
  ) {}

  async execute(
    state: AgentState,
  ): Promise<AgentState> {

    console.log(
      "Executing GENERATE",
    );

    const result =
      await this.orchestrator.generateProject(
        state.request,
        state.projectPath,
      );

return {
  ...state,
  framework: result.framework,
  currentStep: AgentStep.REVIEW,
};
  }
}
