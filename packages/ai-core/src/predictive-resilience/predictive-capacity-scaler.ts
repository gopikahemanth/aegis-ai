/**
 * PredictiveCapacityScaler
 *
 * Recommends pre-failure worker and connection scaling based on failure probability.
 */

export interface CapacityScaleRecommendation {
  resource: "WORKER_POOL" | "DATABASE_POOL";
  currentCapacity: number;
  recommendedCapacity: number;
  scaleAction: "MAINTAIN" | "PRE_SCALE" | "SCALE_UP" | "REQUEST_AUTHORIZATION";
  rationale: string;
}

export class PredictiveCapacityScaler {
  public static evaluateScaling(
    resource: CapacityScaleRecommendation["resource"],
    currentCapacity: number,
    failureProbability: number
  ): CapacityScaleRecommendation {
    if (failureProbability > 70) {
      return {
        resource,
        currentCapacity,
        recommendedCapacity: currentCapacity + 4,
        scaleAction: "PRE_SCALE",
        rationale: `Failure probability at ${failureProbability}%. Pre-scaling 4 additional units to preserve continuity.`,
      };
    }

    return {
      resource,
      currentCapacity,
      recommendedCapacity: currentCapacity,
      scaleAction: "MAINTAIN",
      rationale: "Capacity headroom normal.",
    };
  }
}
