import type { AIProvider } from "../providers/base.js";
import type { ProjectSpecification } from "./specification.js";
import { PromptManager } from "../prompts/prompt-manager.js";

export class ArchitectureGenerator {
  private readonly promptManager = new PromptManager();

  constructor(
    private readonly provider: AIProvider,
  ) {}

  async generate(
    specification: ProjectSpecification,
  ): Promise<string> {

    return this.provider.chat([
      {
        role: "system",
        content: this.promptManager.getArchitecturePrompt(),
      },
      {
        role: "user",
        content: JSON.stringify(
          specification,
          null,
          2,
        ),
      },
    ]);
  }
}
