import type { AgentState } from "../state/agent-state.js";
import type { ActionResult } from "./action-result.js";

import { ErrorAnalyzer } from "@aegis/project-builder";

export class HealAction {

  private readonly analyzer =
    new ErrorAnalyzer();

  async execute(
    state: AgentState,
  ): Promise<ActionResult> {

    console.log(
      "Executing HEAL",
    );

    const error =
      this.analyzer.analyze(
        "Build failed.",
        "",
      );

    console.log(
      "Heal Summary:",
      error.summary,
    );

    return {
      success: true,

      state: {
        ...state,
        healAttempts:
          state.healAttempts + 1,
      },
    };
  }
}
