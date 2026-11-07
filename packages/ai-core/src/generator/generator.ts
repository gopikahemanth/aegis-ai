import type { AIProvider, ChatOptions } from "../providers/base.js";
import { PromptManager } from "../prompts/prompt-manager.js";
import { TokenBudgetManager } from "../context/token-budget.js";
import { BudgetExceededError } from "../governance/generation-budget-guard.js";
import { PromptBudgetInstrumenter } from "../governance/prompt-budget-instrumenter.js";

export class Generator {
  private readonly promptManager = new PromptManager();

  constructor(
    private readonly provider: AIProvider,
  ) {}

  async generate(prompt: string, options?: ChatOptions) {
    const sysPrompt = this.promptManager.getCoderPrompt();
    const totalEstTokens = TokenBudgetManager.estimateTokens(sysPrompt, true) + TokenBudgetManager.estimateTokens(prompt, true);
    const activeCeiling = PromptBudgetInstrumenter.getActiveCeiling(this.provider.name);
    if (totalEstTokens > activeCeiling) {
      throw new BudgetExceededError(
        `Implementation prompt token count (${totalEstTokens.toLocaleString()} tokens) exceeds model context capacity ceiling of ${activeCeiling.toLocaleString()} tokens for provider "${this.provider.name}"! System: ${TokenBudgetManager.estimateTokens(sysPrompt, true)}, User: ${TokenBudgetManager.estimateTokens(prompt, true)}.`
      );
    }

    return this.provider.chat([
      {
        role: "system",
        content: sysPrompt,
      },
      {
        role: "user",
        content: prompt,
      },
    ], options);
  }
}
