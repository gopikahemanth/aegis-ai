import type { AgentState } from "../state/agent-state.js";
import type { ActionResult } from "./action-result.js";

import { EditEngine } from "@aegis/ai-core";

export class EditAction {
  constructor(
    private readonly editor: EditEngine,
  ) {}

  async execute(
    state: AgentState,
  ): Promise<ActionResult> {

    console.log(
      "Executing EDIT",
    );

    const result =
      await this.editor.edit(
        state.request,
        state.projectPath,
      );

    return {
      success: result.filesPatched > 0,
      state,
    };
  }
}
