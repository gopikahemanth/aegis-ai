/**
 * PromptBudgetInstrumenter
 *
 * Instruments prompts at the provider boundary to measure:
 * - System prompt tokens
 * - User prompt tokens
 * - Route-plan tokens
 * - Design-brief tokens
 * - Architecture-contract tokens
 * - File-context tokens
 * - Duplicate content detection
 * - Total estimated prompt tokens
 *
 * Enforces:
 * - Target: < 8,500 tokens per implementation task
 * - Regression ceiling: <= 12,000 tokens for representative benchmark tasks
 */
import { TokenBudgetManager } from "../context/token-budget.js";
import { BudgetExceededError, GenerationBudgetGuard } from "./generation-budget-guard.js";

export interface PromptSectionBreakdown {
  routePlan?: string;
  designBrief?: string;
  architectureContract?: string;
  fileContext?: string;
}

export interface PromptMeasurementReport {
  systemPromptTokens: number;
  userPromptTokens: number;
  routePlanTokens: number;
  designBriefTokens: number;
  architectureContractTokens: number;
  fileContextTokens: number;
  duplicateContentDetected: boolean;
  duplicateDetails?: string[];
  totalEstimatedPromptTokens: number;
  passedCeiling: boolean; // <= 12,000
  passedTarget: boolean;  // <= 8,500
}

export class PromptBudgetInstrumenter {
  public static readonly TARGET_TASK_TOKENS = 8500;
  public static readonly REGRESSION_CEILING_TOKENS = 12000;

  private static customCeiling: number | null = null;
  private static benchmarkMode = false;

  public static setBenchmarkMode(enabled: boolean): void {
    this.benchmarkMode = enabled;
  }

  public static isBenchmarkMode(): boolean {
    return this.benchmarkMode || process.env.AEGIS_BENCHMARK_MODE === "true" || GenerationBudgetGuard.isBenchmarkMode();
  }

  public static setCustomCeiling(ceiling: number | null): void {
    this.customCeiling = ceiling;
  }

  // Model-specific context capacity ceilings (prompt input safe ceiling)
  private static readonly MODEL_CEILINGS: Record<string, number> = {
    // Gemini models (1M-2M context window)
    "gemini-1.5-pro": 200000,
    "gemini-2.5-pro": 200000,
    "gemini-1.5-flash": 120000,
    "gemini-2.0-flash": 120000,
    "gemini-2.5-flash": 120000,
    "gemini-3.6-flash": 120000,
    "gemini-2.0-flash-lite": 64000,
    // Anthropic models (200k context window)
    "claude-3-5-sonnet": 160000,
    "claude-sonnet-4": 160000,
    "claude-3-opus": 160000,
    "claude-3-5-haiku": 120000,
    "claude-haiku-4": 120000,
    // OpenAI models (128k context window)
    "gpt-5.5": 100000,
    "gpt-4o": 100000,
    "gpt-4.5": 100000,
    "gpt-5.5-mini": 64000,
    "gpt-4o-mini": 64000,
    // DeepSeek / OpenRouter models (64k-128k context window)
    "deepseek-chat": 48000,
    "deepseek-coder": 48000,
    "deepseek/deepseek-chat": 48000,
    // Open-source / Fast serving models
    "qwen/qwen3.8-27b": 16000,
    "qwen-3.8-27b": 16000,
    "gpt-oss-120b": 16000,
    "openai/gpt-oss-120b": 16000,
    "llama3.1": 32000,
    "llama3.3-70b": 48000,
  };

  /**
   * Resolves the active prompt ceiling dynamically based on provider context capacity,
   * user configuration, or benchmark regression enforcement mode.
   */
  public static getActiveCeiling(providerOrModel?: string): number {
    if (this.customCeiling !== null) {
      return this.customCeiling;
    }

    if (this.isBenchmarkMode()) {
      return this.REGRESSION_CEILING_TOKENS;
    }

    if (process.env.AEGIS_PROMPT_CEILING) {
      const parsed = parseInt(process.env.AEGIS_PROMPT_CEILING, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }

    const norm = (providerOrModel || "").toLowerCase().trim();

    // 1. Exact match or path suffix match first
    for (const [modelKey, ceiling] of Object.entries(this.MODEL_CEILINGS)) {
      if (norm === modelKey || norm.endsWith(`/${modelKey}`)) {
        return ceiling;
      }
    }

    // 2. Substring match, sorting keys longest first so more specific models match before prefixes
    // (e.g. "gemini-2.0-flash-lite" matches before "gemini-2.0-flash")
    const sortedEntries = Object.entries(this.MODEL_CEILINGS).sort((a, b) => b[0].length - a[0].length);
    for (const [modelKey, ceiling] of sortedEntries) {
      if (norm.includes(modelKey)) {
        return ceiling;
      }
    }

    // 2. Provider family fallbacks
    if (norm.includes("gemini")) {
      return 120000;
    }
    if (norm.includes("anthropic") || norm.includes("claude")) {
      return 150000;
    }
    if (norm.includes("openai") || norm.includes("gpt")) {
      return 96000;
    }
    if (norm.includes("openrouter") || norm.includes("deepseek")) {
      return 48000;
    }
    if (norm.includes("groq") || norm.includes("cerebras")) {
      return 6000;
    }

    // Default general-purpose model context capacity ceiling
    return 32000;
  }

  public static measurePrompt(
    systemPrompt: string,
    userPrompt: string,
    sections?: PromptSectionBreakdown,
    providerName?: string,
  ): PromptMeasurementReport {
    const systemPromptTokens = TokenBudgetManager.estimateTokens(systemPrompt, true);
    const userPromptTokens = TokenBudgetManager.estimateTokens(userPrompt, true);
    const totalEstimatedPromptTokens = systemPromptTokens + userPromptTokens;
    const activeCeiling = providerName
      ? this.getActiveCeiling(providerName)
      : (this.customCeiling !== null ? this.customCeiling : this.REGRESSION_CEILING_TOKENS);

    const routePlanTokens = sections?.routePlan
      ? TokenBudgetManager.estimateTokens(sections.routePlan, true)
      : 0;
    const designBriefTokens = sections?.designBrief
      ? TokenBudgetManager.estimateTokens(sections.designBrief, true)
      : 0;
    const architectureContractTokens = sections?.architectureContract
      ? TokenBudgetManager.estimateTokens(sections.architectureContract, true)
      : 0;
    const fileContextTokens = sections?.fileContext
      ? TokenBudgetManager.estimateTokens(sections.fileContext, true)
      : 0;

    // Detect duplicate content in userPrompt
    const { detected, duplicates } = this.detectDuplicateContent(userPrompt);

    return {
      systemPromptTokens,
      userPromptTokens,
      routePlanTokens,
      designBriefTokens,
      architectureContractTokens,
      fileContextTokens,
      duplicateContentDetected: detected,
      duplicateDetails: duplicates,
      totalEstimatedPromptTokens,
      passedCeiling: totalEstimatedPromptTokens <= activeCeiling,
      passedTarget: totalEstimatedPromptTokens <= this.TARGET_TASK_TOKENS,
    };
  }

  public static assertWithinCeiling(report: PromptMeasurementReport, maxCeilingOrProvider?: number | string): void {
    let ceiling: number;
    if (typeof maxCeilingOrProvider === "number") {
      ceiling = maxCeilingOrProvider;
    } else if (typeof maxCeilingOrProvider === "string") {
      ceiling = this.customCeiling !== null ? this.customCeiling : (this.isBenchmarkMode() ? this.REGRESSION_CEILING_TOKENS : this.getActiveCeiling(maxCeilingOrProvider));
    } else {
      ceiling = this.customCeiling !== null ? this.customCeiling : this.REGRESSION_CEILING_TOKENS;
    }

    if (report.totalEstimatedPromptTokens > ceiling) {
      throw new BudgetExceededError(
        `Implementation prompt token count (${report.totalEstimatedPromptTokens.toLocaleString()} tokens) exceeds regression ceiling of ${ceiling.toLocaleString()} tokens! System: ${report.systemPromptTokens}, User: ${report.userPromptTokens}, Files: ${report.fileContextTokens}. Request must be split or pruned; requirements cannot be silently truncated.`
      );
    }
  }

  public static detectDuplicateContent(text: string): { detected: boolean; duplicates: string[] } {
    const duplicates: string[] = [];
    const filePattern = /===\s*FILE:\s*([^\s=]+)\s*===/gi;
    const fileMatches = new Map<string, number>();

    let match: RegExpExecArray | null;
    while ((match = filePattern.exec(text)) !== null) {
      const filePath = match[1].trim();
      const count = (fileMatches.get(filePath) || 0) + 1;
      fileMatches.set(filePath, count);
    }

    for (const [path, count] of fileMatches.entries()) {
      if (count > 1) {
        duplicates.push(`File "${path}" is included ${count} times in the prompt.`);
      }
    }

    // Check for duplicate PageExperiencePlan headers
    const pepMatches = text.match(/PAGE EXPERIENCE PLANS \(ROUTE-BY-ROUTE FIRST-CLASS DESIGNS\)/g);
    if (pepMatches && pepMatches.length > 1) {
      duplicates.push(`PageExperiencePlan header is duplicated ${pepMatches.length} times.`);
    }

    // Check for duplicate Architecture Lock blocks
    const archLockMatches = text.match(/ARCHITECTURE LOCK \(IMMUTABLE — DO NOT DEVIATE OR SUBSTITUTE\)/g);
    if (archLockMatches && archLockMatches.length > 1) {
      duplicates.push(`Architecture lock block is duplicated ${archLockMatches.length} times.`);
    }

    return {
      detected: duplicates.length > 0,
      duplicates,
    };
  }
}

