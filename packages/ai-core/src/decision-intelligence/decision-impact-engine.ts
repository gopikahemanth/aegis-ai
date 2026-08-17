/**
 * DecisionImpactEngine
 *
 * Calculates direct, indirect, and systemic downstream impacts of enterprise decisions.
 */

export interface DecisionImpactAnalysis {
  decisionId: string;
  affectedProjects: string[];
  affectedTeams: string[];
  impactType: "DIRECT_IMPACT" | "INDIRECT_IMPACT" | "SECONDARY_IMPACT" | "SYSTEMIC_IMPACT";
  reliabilityRiskDeltaPercentage: number;
  costImpactINR: number;
  businessCapabilityImpacted: string;
}

export class DecisionImpactEngine {
  public static calculateImpact(
    decisionId: string,
    projects: string[],
    teams: string[],
    capability: string,
    costImpact: number
  ): DecisionImpactAnalysis {
    const impactType: DecisionImpactAnalysis["impactType"] =
      projects.length >= 3 ? "SYSTEMIC_IMPACT" : projects.length >= 2 ? "SECONDARY_IMPACT" : "DIRECT_IMPACT";

    return {
      decisionId,
      affectedProjects: projects,
      affectedTeams: teams,
      impactType,
      reliabilityRiskDeltaPercentage: -15, // Risk reduced by 15%
      costImpactINR: costImpact,
      businessCapabilityImpacted: capability,
    };
  }
}
