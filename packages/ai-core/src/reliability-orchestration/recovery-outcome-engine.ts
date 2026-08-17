/**
 * RecoveryOutcomeEngine
 *
 * Verifies technical, runtime, data, and business continuity outcomes.
 * Hard Invariant: SERVICE_RECOVERED != BUSINESS_CAPABILITY_RECOVERED.
 */

export interface MasterRecoveryOutcomeReport {
  verificationId: string;
  projectId: string;
  isTechnicalRecovered: boolean;
  isDataRecovered: boolean;
  isApiRecovered: boolean;
  isBusinessWorkflowRecovered: boolean;
  finalOutcome: "TECHNICALLY_RECOVERED" | "BUSINESS_RECOVERED" | "PARTIALLY_RECOVERED" | "RECOVERY_FAILED";
  summary: string;
}

export class RecoveryOutcomeEngine {
  public static verifyOutcome(
    projectId: string,
    technical: boolean,
    data: boolean,
    api: boolean,
    businessWorkflow: boolean
  ): MasterRecoveryOutcomeReport {
    let outcome: MasterRecoveryOutcomeReport["finalOutcome"] = "RECOVERY_FAILED";

    if (technical && data && api && businessWorkflow) {
      outcome = "BUSINESS_RECOVERED";
    } else if (technical && data && api) {
      outcome = "TECHNICALLY_RECOVERED";
    } else if (technical) {
      outcome = "PARTIALLY_RECOVERED";
    }

    return {
      verificationId: `rec_out_${Date.now()}`,
      projectId,
      isTechnicalRecovered: technical,
      isDataRecovered: data,
      isApiRecovered: api,
      isBusinessWorkflowRecovered: businessWorkflow,
      finalOutcome: outcome,
      summary: `Recovery outcome for "${projectId}": ${outcome}.`,
    };
  }
}
