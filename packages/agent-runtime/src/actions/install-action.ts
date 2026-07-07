import type { AgentState } from "../state/agent-state.js";
import type { ActionResult } from "./action-result.js";

import { DependencyInstaller } from "@aegis/project-builder";

export class InstallAction {

  private readonly installer =
    new DependencyInstaller();

  async execute(
    state: AgentState,
  ): Promise<ActionResult> {

    console.log(
      "Executing INSTALL",
    );

    const result =
      await this.installer.install(
        "pnpm",
        state.projectPath,
      );

    return {
      success: result.exitCode === 0,

      state,
    };
  }
}
