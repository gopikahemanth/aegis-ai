/**
 * RecoveryOutcomeAnalyzer
 *
 * Compares planned disaster recovery expectations against actual execution evidence.
 */

export interface RecoveryOutcomeReport {
  analysisId: string;
  projectId: string;
  plannedRTOSeconds: number;
  actualRTOSeconds: number;
  plannedRPOSeconds: number;
  actualRPOSeconds: number;
  dataIntegrityPassed: boolean;
  businessWorkflowIntegrityPassed: boolean;
  outcomeStatus: "BETTER_THAN_EXPECTED" | "MEETS_TARGET" | "DEGRADED" | "FAILED" | "INSUFFICIENT_EVIDENCE";
  recommendations: string[];
}

export class RecoveryOutcomeAnalyzer {
  public static analyzeOutcome(params: {
    projectId: string;
    plannedRTOSeconds: number;
    actualRTOSeconds: number;
    plannedRPOSeconds: number;
    actualRPOSeconds: number;
    dataIntegrityPassed: boolean;
    businessWorkflowIntegrityPassed: boolean;
  }): RecoveryOutcomeReport {
    const isIntegrityOk = params.dataIntegrityPassed && params.businessWorkflowIntegrityPassed;

    let status: RecoveryOutcomeReport["outcomeStatus"] = "MEETS_TARGET";
    const recommendations: string[] = [];

    if (!isIntegrityOk) {
      status = "FAILED";
      recommendations.push("Data integrity or business workflow check failed. Review restore scripts.");
    } else if (params.actualRTOSeconds < params.plannedRTOSeconds * 0.8) {
      status = "BETTER_THAN_EXPECTED";
      recommendations.push("Recovery executed faster than planned target.");
    } else if (params.actualRTOSeconds > params.plannedRTOSeconds) {
      status = "DEGRADED";
      recommendations.push("RTO breached planned threshold. Optimize database restore parallelization.");
    }

    return {
      analysisId: `rec_out_${Date.now()}`,
      projectId: params.projectId,
      plannedRTOSeconds: params.plannedRTOSeconds,
      actualRTOSeconds: params.actualRTOSeconds,
      plannedRPOSeconds: params.plannedRPOSeconds,
      actualRPOSeconds: params.actualRPOSeconds,
      dataIntegrityPassed: params.dataIntegrityPassed,
      businessWorkflowIntegrityPassed: params.businessWorkflowIntegrityPassed,
      outcomeStatus: status,
      recommendations,
    };
  }
}
