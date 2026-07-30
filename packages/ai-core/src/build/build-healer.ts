import type { AIProvider } from "../providers/base.js";
import { PromptManager } from "../prompts/prompt-manager.js";

export class BuildHealer {
  private readonly promptManager = new PromptManager();

  constructor(
    private readonly provider: AIProvider,
  ) {}

  async heal(
    request: string,
    buildError: string,
    projectSummary: string,
  ): Promise<string> {

    return this.provider.chat([
      {
        role: "system",
        content: this.promptManager.getRepairPrompt(request, buildError, projectSummary),
      },
    ], { agentType: "healer" });
  }
}
