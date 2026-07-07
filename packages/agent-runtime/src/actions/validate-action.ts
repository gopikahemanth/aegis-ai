import type { AgentState } from "../state/agent-state.js";
import type { ActionResult } from "./action-result.js";

import {
  ProjectValidator,
} from "../services/project-validator.js";

export class ValidateAction {
  private readonly validator =
    new ProjectValidator();

  async execute(
    state: AgentState,
  ): Promise<ActionResult> {

    console.log(
      "Executing VALIDATE",
    );

    const result =
      this.validator.validate(
        state.projectPath,
      );

    if (!result.passed) {

      console.log(
        "Validation failed:",
      );

      console.table(
        result.issues,
      );

      return {
        success: false,

        state,
      };
    }

    console.log(
      "Validation passed.",
    );

    return {
      success: true,

      state,
    };
  }
}
