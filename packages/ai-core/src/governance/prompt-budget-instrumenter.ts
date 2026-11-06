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

  public static measurePrompt(
    systemPrompt: string,
    userPrompt: string,
    sections?: PromptSectionBreakdown
  ): PromptMeasurementReport {
    const systemPromptTokens = TokenBudgetManager.estimateTokens(systemPrompt, true);
    const userPromptTokens = TokenBudgetManager.estimateTokens(userPrompt, true);
    const totalEstimatedPromptTokens = systemPromptTokens + userPromptTokens;

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
      passedCeiling: totalEstimatedPromptTokens <= this.REGRESSION_CEILING_TOKENS,
      passedTarget: totalEstimatedPromptTokens <= this.TARGET_TASK_TOKENS,
    };
  }

  public static assertWithinCeiling(report: PromptMeasurementReport): void {
    if (!report.passedCeiling) {
      throw new Error(
        `[PromptBudgetInstrumenter] Prompt token count (${report.totalEstimatedPromptTokens.toLocaleString()} tokens) exceeds regression ceiling of ${this.REGRESSION_CEILING_TOKENS.toLocaleString()} tokens! System: ${report.systemPromptTokens}, User: ${report.userPromptTokens}, Files: ${report.fileContextTokens}. Request must be split or pruned; requirements cannot be silently truncated.`
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

