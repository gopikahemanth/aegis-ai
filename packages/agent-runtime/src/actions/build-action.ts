import type { AgentState } from "../state/agent-state.js";
import type { ActionResult } from "./action-result.js";

import { BuildRunner } from "@aegis/project-builder";

export class BuildAction {

  private readonly runner =
    new BuildRunner();

  async execute(
    state: AgentState,
  ): Promise<ActionResult> {

    console.log(
      "Executing BUILD",
    );

    const result =
      await this.runner.build(
        "pnpm",
        state.projectPath,
      );

    return {
      success: result.success,

      state: {
        ...state,
        buildPassed:
          result.success,
      },
    };
  }
}
