import type { AgentState } from "../state/agent-state.js";
import type { ActionResult } from "./action-result.js";

import {
  Parser,
  FileWriter,
} from "@aegis/ai-core";

export class WriteAction {
  private readonly parser =
    new Parser();

  private readonly writer =
    new FileWriter();

  async execute(
    state: AgentState,
  ): Promise<ActionResult> {

    console.log(
      "Executing WRITE",
    );

    if (!state.generatedResponse) {
      return {
        success: false,
        state,
      };
    }

    const files =
      this.parser.parse(
        state.generatedResponse,
      );

    this.writer.write(
      files,
      state.projectPath,
    );

    return {
      success: true,
      state,
    };
  }
}
