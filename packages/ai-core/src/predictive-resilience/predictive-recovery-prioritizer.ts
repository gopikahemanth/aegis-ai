/**
 * PredictiveRecoveryPrioritizer
 *
 * Prioritizes failure interventions based on probability, impact, and recovery difficulty.
 */

export interface PrioritizedIntervention {
  title: string;
  probability: number;
  businessImpact: number;
  priorityClass: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  priorityScore: number;
}

export class PredictiveRecoveryPrioritizer {
  public static prioritize(
    interventions: Array<{ title: string; probability: number; businessImpact: number }>
  ): PrioritizedIntervention[] {
    return interventions
      .map((item) => {
        const score = Math.round(item.probability * 0.6 + item.businessImpact * 0.4);
        let pClass: PrioritizedIntervention["priorityClass"] = "LOW";
        if (score >= 80) pClass = "CRITICAL";
        else if (score >= 60) pClass = "HIGH";
        else if (score >= 40) pClass = "MEDIUM";

        return {
          ...item,
          priorityClass: pClass,
          priorityScore: score,
        };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }
}
