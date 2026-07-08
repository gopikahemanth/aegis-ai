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
   console.log("Build Result:", {
  success: result.success,
  exitCode: result.exitCode,
});

console.log("STDOUT:");
console.log(result.stdout);

console.log("STDERR:");
console.log(result.stderr);
    return {
      success: result.success,

      state: {
  ...state,
  buildPassed: result.success,
  buildStdout: result.stdout,
  buildStderr: result.stderr,
},
    };
  }
}
