/**
 * EvolutionRiskEngine
 *
 * Quantifies evolution risk based on architectural depth, rollback readiness, and database migrations.
 */

export interface EvolutionRiskInputs {
  opportunityId: string;
  hasRollbackPlan: boolean;
  isDatabaseRestructure: boolean;
  affectedComponentsCount: number;
  historicalFailureRate: number;
}

export interface EvolutionRiskReport {
  opportunityId: string;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "BLOCKED";
  riskScore: number;
  governanceBypassPermitted: boolean; // Strictly false
  summary: string;
}

export class EvolutionRiskEngine {
  public static evaluateRisk(inputs: EvolutionRiskInputs): EvolutionRiskReport {
    if (!inputs.hasRollbackPlan) {
      return {
        opportunityId: inputs.opportunityId,
        riskLevel: "BLOCKED",
        riskScore: 100,
        governanceBypassPermitted: false,
        summary: "ROLLBACK_PLAN_REQUIRED: Evolution without verified rollback plan is blocked.",
      };
    }

    let score = inputs.affectedComponentsCount * 8 + inputs.historicalFailureRate * 0.3;
    if (inputs.isDatabaseRestructure) score += 30;

    let riskLevel: EvolutionRiskReport["riskLevel"] = "LOW";
    if (score > 70) riskLevel = "CRITICAL";
    else if (score > 45) riskLevel = "HIGH";
    else if (score > 20) riskLevel = "MODERATE";

    return {
      opportunityId: inputs.opportunityId,
      riskLevel,
      riskScore: Math.min(100, Math.round(score)),
      governanceBypassPermitted: false,
      summary: `Evolution risk evaluated as ${riskLevel} (Risk score: ${Math.round(score)}/100).`,
    };
  }
}
