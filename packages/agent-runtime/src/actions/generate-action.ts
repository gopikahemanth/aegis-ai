import type { AgentState } from "../state/agent-state.js";
import type { Orchestrator } from "@aegis/ai-core";
import type { ActionResult } from "./action-result.js";

import { ProjectCreator } from "@aegis/project-builder";

export class GenerateAction {
  private readonly creator =
    new ProjectCreator();

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
  await this.orchestrator.generateApplication(
    state.request,
    state.projectPath,
  );

   await this.creator.create(
  state.framework ?? "react",
  "generated-project",
  state.projectPath,
);

    return {
      success: true,

     state: {
  ...state,
},
    };
  }
}
