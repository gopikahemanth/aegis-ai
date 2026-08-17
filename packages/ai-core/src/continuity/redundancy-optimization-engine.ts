/**
 * RedundancyOptimizationEngine
 *
 * Evaluates service, database, and worker redundancy levels to optimize availability and cost.
 */

export interface RedundancyAssessment {
  componentName: string;
  currentReplicas: number;
  recommendedReplicas: number;
  status: "SINGLE_POINT_OF_FAILURE" | "INSUFFICIENT_REDUNDANCY" | "OPTIMAL" | "OVER_REDUNDANCY";
  costImpactINR: number;
}

export class RedundancyOptimizationEngine {
  public static evaluateRedundancy(componentName: string, currentReplicas: number, isCritical: boolean): RedundancyAssessment {
    if (currentReplicas === 1 && isCritical) {
      return {
        componentName,
        currentReplicas,
        recommendedReplicas: 2,
        status: "SINGLE_POINT_OF_FAILURE",
        costImpactINR: 15000,
      };
    }

    if (currentReplicas >= 2 && currentReplicas <= 3) {
      return {
        componentName,
        currentReplicas,
        recommendedReplicas: currentReplicas,
        status: "OPTIMAL",
        costImpactINR: 0,
      };
    }

    return {
      componentName,
      currentReplicas,
      recommendedReplicas: 3,
      status: currentReplicas > 3 ? "OVER_REDUNDANCY" : "INSUFFICIENT_REDUNDANCY",
      costImpactINR: currentReplicas > 3 ? -10000 : 20000,
    };
  }
}
