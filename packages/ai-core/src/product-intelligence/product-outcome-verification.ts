/**
 * ProductOutcomeVerificationEngine
 *
 * Verifies product changes across Technical, Security, Product, Operational, and Business dimensions.
 * Hard Invariant: IMPLEMENTATION SUCCESS != PRODUCT SUCCESS != BUSINESS SUCCESS.
 */

export type ProductOutcomeStatus =
  | "SUCCESS"
  | "PARTIAL_SUCCESS"
  | "FAILED"
  | "REGRESSED"
  | "INSUFFICIENT_EVIDENCE";

export interface ProductVerificationInputs {
  opportunityId: string;
  technicalBuildPassed: boolean;
  securityChecksPassed: boolean;
  productFeaturesVerified: boolean;
  operationalLatencyHealthy: boolean;
  businessKpiPreserved: boolean;
}

export interface ProductVerificationReport {
  opportunityId: string;
  technicalVerified: boolean;
  securityVerified: boolean;
  productVerified: boolean;
  operationalVerified: boolean;
  businessVerified: boolean;
  status: ProductOutcomeStatus;
  confidenceScore: number;
  summary: string;
}

export class ProductOutcomeVerificationEngine {
  public static verifyOutcome(inputs: ProductVerificationInputs): ProductVerificationReport {
    const tech = inputs.technicalBuildPassed;
    const sec = inputs.securityChecksPassed;
    const prod = inputs.productFeaturesVerified;
    const op = inputs.operationalLatencyHealthy;
    const biz = inputs.businessKpiPreserved;

    const allPassed = tech && sec && prod && op && biz;
    const status: ProductOutcomeStatus = allPassed
      ? "SUCCESS"
      : !tech || !sec
      ? "FAILED"
      : "PARTIAL_SUCCESS";

    return {
      opportunityId: inputs.opportunityId,
      technicalVerified: tech,
      securityVerified: sec,
      productVerified: prod,
      operationalVerified: op,
      businessVerified: biz,
      status,
      confidenceScore: allPassed ? 0.99 : 0.65,
      summary: allPassed
        ? "Product changes verified cleanly across Technical, Security, Product, Operational, and Business layers."
        : "Product verification failed or partially degraded across one or more dimensions.",
    };
  }
}
