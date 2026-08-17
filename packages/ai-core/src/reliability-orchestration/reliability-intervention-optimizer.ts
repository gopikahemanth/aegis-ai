/**
 * ReliabilityInterventionOptimizer
 *
 * Compares multi-variable reliability remediation paths to determine the safest viable option.
 */

export interface OptimizedIntervention {
  interventionType: "FAILOVER" | "SCALE" | "ROLLBACK" | "RESTORE" | "ISOLATE" | "RESTART";
  riskReduction: number;
  successProbability: number;
  blastRadius: "LOW" | "MODERATE" | "HIGH";
  estimatedRecoverySeconds: number;
  costINR: number;
  safetyScore: number;
}

export class ReliabilityInterventionOptimizer {
  public static selectSafestIntervention(
    candidates: OptimizedIntervention[]
  ): OptimizedIntervention {
    return [...candidates].sort((a, b) => b.safetyScore - a.safetyScore)[0];
  }
}
