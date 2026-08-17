/**
 * ExecutionResourceGovernanceEngine
 *
 * Enforces resource consumption limits during autonomous execution.
 */

export interface ResourceConsumptionReport {
  executionId: string;
  tokensConsumed: number;
  maxTokensAllowed: number;
  computeTimeMs: number;
  maxComputeTimeMs: number;
  status: "NORMAL" | "WARNING" | "HIGH_USAGE" | "LIMIT_REACHED" | "BLOCKED";
  isBlocked: boolean;
}

export class ExecutionResourceGovernanceEngine {
  public static checkBudget(
    executionId: string,
    tokens: number,
    maxTokens: number,
    computeMs: number,
    maxComputeMs: number
  ): ResourceConsumptionReport {
    const tokenRatio = tokens / (maxTokens || 1);
    const timeRatio = computeMs / (maxComputeMs || 1);
    const maxRatio = Math.max(tokenRatio, timeRatio);

    let status: ResourceConsumptionReport["status"] = "NORMAL";
    let isBlocked = false;

    if (maxRatio >= 1.0) {
      status = "LIMIT_REACHED";
      isBlocked = true;
    } else if (maxRatio >= 0.85) {
      status = "HIGH_USAGE";
    } else if (maxRatio >= 0.7) {
      status = "WARNING";
    }

    return {
      executionId,
      tokensConsumed: tokens,
      maxTokensAllowed: maxTokens,
      computeTimeMs: computeMs,
      maxComputeTimeMs: maxComputeMs,
      status,
      isBlocked,
    };
  }
}
