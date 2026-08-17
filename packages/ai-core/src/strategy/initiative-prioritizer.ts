/**
 * InitiativePrioritizer
 *
 * Deterministically evaluates and prioritizes strategic initiatives based on
 * security, reliability, compliance, debt, and business value.
 */

import type { StrategicInitiative } from "./strategic-initiative.js";

export interface PrioritizationFactors {
  securityImpact: number; // 0 - 100
  reliabilityImpact: number; // 0 - 100
  complianceUrgency: number; // 0 - 100
  businessValue: number; // 0 - 100
  technicalDebtReduction: number; // 0 - 100
}

export class InitiativePrioritizer {
  public static prioritize(
    initiative: StrategicInitiative,
    factors: PrioritizationFactors
  ): { priorityClass: StrategicInitiative["priorityClass"]; score: number; reasoning: string } {
    const score =
      factors.securityImpact * 0.35 +
      factors.complianceUrgency * 0.25 +
      factors.reliabilityImpact * 0.2 +
      factors.businessValue * 0.1 +
      factors.technicalDebtReduction * 0.1;

    let priorityClass: StrategicInitiative["priorityClass"] = "MEDIUM";
    if (score >= 80) priorityClass = "CRITICAL";
    else if (score >= 60) priorityClass = "HIGH";
    else if (score < 30) priorityClass = "DEFER";

    return {
      priorityClass,
      score: Math.round(score),
      reasoning: `Weighted score ${Math.round(score)} (Security: ${factors.securityImpact}%, Compliance: ${factors.complianceUrgency}%).`,
    };
  }
}
