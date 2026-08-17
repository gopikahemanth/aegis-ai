/**
 * InnovationOutcomeEngine
 *
 * Evaluates realized business value, ROI, and KPI improvements from completed innovations.
 * Hard Invariant: Expected business benefit != realized value.
 */

export type InnovationOutcomeClassification =
  | "VALUE_REALIZED"
  | "PARTIAL_VALUE"
  | "NO_VALUE"
  | "NEGATIVE_VALUE"
  | "REGRESSION"
  | "UNEXPECTED_VALUE"
  | "UNEXPECTED_REGRESSION"
  | "INSUFFICIENT_EVIDENCE";

export interface InnovationOutcomeReport {
  opportunityId: string;
  projectId: string;
  expectedValueINR: number;
  observedValueINR: number;
  verifiedValueINR: number;
  costINR: number;
  realizedRoi: number;
  classification: InnovationOutcomeClassification;
  summary: string;
}

export class InnovationOutcomeEngine {
  public static evaluateOutcome(
    opportunityId: string,
    projectId: string,
    expectedValueINR: number,
    observedValueINR: number,
    verifiedValueINR: number,
    costINR: number
  ): InnovationOutcomeReport {
    let classification: InnovationOutcomeClassification = "VALUE_REALIZED";

    if (verifiedValueINR < 0) {
      classification = "REGRESSION";
    } else if (verifiedValueINR === 0) {
      classification = "NO_VALUE";
    } else if (verifiedValueINR > expectedValueINR * 1.5) {
      classification = "UNEXPECTED_VALUE";
    } else if (verifiedValueINR < expectedValueINR * 0.7) {
      classification = "PARTIAL_VALUE";
    }

    const roi = costINR > 0 ? Number((verifiedValueINR / costINR).toFixed(2)) : 5;

    return {
      opportunityId,
      projectId,
      expectedValueINR,
      observedValueINR,
      verifiedValueINR,
      costINR,
      realizedRoi: roi,
      classification,
      summary: `Innovation outcome classified as ${classification} (Verified Value: ₹${verifiedValueINR.toLocaleString()}, Realized ROI: ${roi}x).`,
    };
  }
}
