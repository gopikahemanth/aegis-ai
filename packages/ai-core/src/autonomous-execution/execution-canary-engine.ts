/**
 * ExecutionCanaryEngine
 *
 * Implements progressive canary promotion and health verification:
 * PREVIEW -> CANARY -> PARTIAL -> FULL
 * Automatic transition to ROLLBACK_REQUIRED upon failure.
 */

export type CanaryStage = "PREVIEW" | "CANARY" | "PARTIAL" | "FULL";

export interface CanaryEvaluationMetrics {
  errorRatePercentage: number;
  p99LatencyMs: number;
  apiSuccessRatePercentage: number;
  healthProbePassed: boolean;
}

export interface CanaryStageResult {
  executionId: string;
  stage: CanaryStage;
  promoted: boolean;
  status: "STAGE_PASSED" | "STAGE_DEGRADED" | "ROLLBACK_REQUIRED";
  summary: string;
}

export class ExecutionCanaryEngine {
  public static evaluateCanary(
    executionId: string,
    currentStage: CanaryStage,
    metrics: CanaryEvaluationMetrics
  ): CanaryStageResult {
    // Failure threshold check
    if (!metrics.healthProbePassed || metrics.errorRatePercentage > 1.0 || metrics.apiSuccessRatePercentage < 99.0) {
      return {
        executionId,
        stage: currentStage,
        promoted: false,
        status: "ROLLBACK_REQUIRED",
        summary: `Canary stage ${currentStage} failed health thresholds (Error rate: ${metrics.errorRatePercentage}%, Success: ${metrics.apiSuccessRatePercentage}%). Triggering rollback.`,
      };
    }

    if (metrics.p99LatencyMs > 250) {
      return {
        executionId,
        stage: currentStage,
        promoted: false,
        status: "STAGE_DEGRADED",
        summary: `Canary stage ${currentStage} shows elevated latency (${metrics.p99LatencyMs}ms). Holding promotion.`,
      };
    }

    // Progression
    let nextStage: CanaryStage = "CANARY";
    if (currentStage === "PREVIEW") nextStage = "CANARY";
    else if (currentStage === "CANARY") nextStage = "PARTIAL";
    else if (currentStage === "PARTIAL") nextStage = "FULL";
    else if (currentStage === "FULL") nextStage = "FULL";

    return {
      executionId,
      stage: nextStage,
      promoted: true,
      status: "STAGE_PASSED",
      summary: `Canary stage ${currentStage} verified successfully. Promoted to ${nextStage}.`,
    };
  }
}
