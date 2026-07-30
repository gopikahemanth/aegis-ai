import type { AIProvider, ChatOptions } from "../providers/base.js";
import { PromptManager } from "../prompts/prompt-manager.js";

export class Generator {
  private readonly promptManager = new PromptManager();

  constructor(
    private readonly provider: AIProvider,
  ) {}

  async generate(prompt: string, options?: ChatOptions) {
    return this.provider.chat([
      {
        role: "system",
        content: this.promptManager.getCoderPrompt(),
      },
      {
        role: "user",
        content: prompt,
      },
    ], options);
  }
}
