/**
 * RecoveryCostOptimizer
 *
 * Compares engineering remediation costs against avoided enterprise business losses.
 */

export interface RecoveryEconomicsEvaluation {
  projectId: string;
  remediationCostINR: number;
  avoidedLossINR: number;
  netBenefitINR: number;
  recommendation: "HIGH_VALUE" | "RECOMMENDED" | "LOW_VALUE" | "COST_PROHIBITIVE";
}

export class RecoveryCostOptimizer {
  public static evaluateEconomics(
    projectId: string,
    remediationCost: number,
    avoidedLoss: number
  ): RecoveryEconomicsEvaluation {
    const net = avoidedLoss - remediationCost;

    let rec: RecoveryEconomicsEvaluation["recommendation"] = "RECOMMENDED";
    if (net > remediationCost * 3) rec = "HIGH_VALUE";
    else if (net < 0) rec = "COST_PROHIBITIVE";

    return {
      projectId,
      remediationCostINR: remediationCost,
      avoidedLossINR: avoidedLoss,
      netBenefitINR: net,
      recommendation: rec,
    };
  }
}
