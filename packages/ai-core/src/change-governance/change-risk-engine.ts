/**
 * ChangeRiskEngine
 *
 * Quantifies change risk based on complexity, dependencies, database migrations,
 * historical component failure rates, and rollback readiness.
 */

export interface ChangeRiskEvaluationInputs {
  changeId: string;
  dependencyCount: number;
  hasDatabaseMigration: boolean;
  isSecuritySensitive: boolean;
  hasRollbackProcedure: boolean;
  historicalFailureRatePercentage: number;
}

export interface ChangeRiskReport {
  changeId: string;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "BLOCKED";
  riskScore: number;
  governanceBypassAllowed: boolean; // Strictly false
  summary: string;
}

export class ChangeRiskEngine {
  public static evaluateRisk(inputs: ChangeRiskEvaluationInputs): ChangeRiskReport {
    if (!inputs.hasRollbackProcedure) {
      return {
        changeId: inputs.changeId,
        riskLevel: "BLOCKED",
        riskScore: 100,
        governanceBypassAllowed: false,
        summary: "ROLLBACK_NOT_CONFIGURED: Change without verified rollback procedure is blocked.",
      };
    }

    let score = inputs.historicalFailureRatePercentage * 0.4 + inputs.dependencyCount * 5;
    if (inputs.hasDatabaseMigration) score += 25;
    if (inputs.isSecuritySensitive) score += 20;

    let riskLevel: ChangeRiskReport["riskLevel"] = "LOW";
    if (score > 75) riskLevel = "CRITICAL";
    else if (score > 50) riskLevel = "HIGH";
    else if (score > 25) riskLevel = "MODERATE";

    return {
      changeId: inputs.changeId,
      riskLevel,
      riskScore: Math.min(100, Math.round(score)),
      governanceBypassAllowed: false,
      summary: `Change risk evaluated as ${riskLevel} (Risk score: ${Math.round(score)}/100).`,
    };
  }
}
