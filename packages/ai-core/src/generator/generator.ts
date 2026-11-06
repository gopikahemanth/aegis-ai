import type { AIProvider, ChatOptions } from "../providers/base.js";
import { PromptManager } from "../prompts/prompt-manager.js";
import { TokenBudgetManager } from "../context/token-budget.js";
import { BudgetExceededError } from "../governance/generation-budget-guard.js";

export class Generator {
  private readonly promptManager = new PromptManager();

  constructor(
    private readonly provider: AIProvider,
  ) {}

  async generate(prompt: string, options?: ChatOptions) {
    const sysPrompt = this.promptManager.getCoderPrompt();
    const totalEstTokens = TokenBudgetManager.estimateTokens(sysPrompt, true) + TokenBudgetManager.estimateTokens(prompt, true);
    if (totalEstTokens > 12000) {
      throw new BudgetExceededError(
        `Implementation prompt token count (${totalEstTokens.toLocaleString()} tokens) exceeds regression ceiling of 12,000 tokens! System: ${TokenBudgetManager.estimateTokens(sysPrompt, true)}, User: ${TokenBudgetManager.estimateTokens(prompt, true)}.`
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
