import type { AgentState } from "../state/agent-state.js";
import type { ActionResult } from "./action-result.js";

import { ErrorAnalyzer } from "@aegis/project-builder";
import { SelfHealer } from "@aegis/ai-core";

export class HealAction {
  constructor(
    private readonly healer: SelfHealer,
  ) {}

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
        state.buildStderr ?? "",
        state.buildStdout ?? "",
      );

    console.log(
      "Heal Summary:",
      error.summary,
    );

    const attempts =
      state.healAttempts + 1;

    const report =
      await this.healer.heal(
        state.request,
        error,
        state.projectPath,
      );

    if (!report.fixed) {
      console.log(
        "Healing produced no changes.",
      );

      return {
        success: false,
        state: {
          ...state,
          healAttempts: attempts,
          completed: true,
        },
      };
    }

    const maxAttempts = 3;

    if (attempts > maxAttempts) {
      console.log(
        `Maximum healing attempts (${maxAttempts}) reached.`,
      );

      return {
        success: false,
        state: {
          ...state,
          healAttempts: attempts,
          completed: true,
        },
      };
    }

    return {
      success: true,
      state: {
        ...state,
        healAttempts: attempts,
      },
    };
  }
}
