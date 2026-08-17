/**
 * CustomerOutcomeVerificationEngine
 *
 * Verifies customer lifecycle and intervention outcomes across 5 dimensions:
 * Onboarding, Adoption, Product Value, Retention, and Business Value.
 * Hard Invariant: CUSTOMER ACTION COMPLETED != CUSTOMER OUTCOME ACHIEVED.
 */

export type CustomerOutcomeStatus =
  | "ACHIEVED"
  | "PARTIALLY_ACHIEVED"
  | "FAILED"
  | "REGRESSED"
  | "INSUFFICIENT_EVIDENCE";

export interface CustomerVerificationInputs {
  customerId: string;
  onboardingVerified: boolean;
  adoptionVerified: boolean;
  productValueVerified: boolean;
  retentionVerified: boolean;
  businessValueVerified: boolean;
}

export interface CustomerOutcomeVerificationReport {
  customerId: string;
  onboardingVerified: boolean;
  adoptionVerified: boolean;
  productValueVerified: boolean;
  retentionVerified: boolean;
  businessValueVerified: boolean;
  status: CustomerOutcomeStatus;
  confidenceScore: number;
  summary: string;
}

export class CustomerOutcomeVerificationEngine {
  public static verifyOutcome(inputs: CustomerVerificationInputs): CustomerOutcomeVerificationReport {
    const onb = inputs.onboardingVerified;
    const adp = inputs.adoptionVerified;
    const pval = inputs.productValueVerified;
    const ret = inputs.retentionVerified;
    const bval = inputs.businessValueVerified;

    const allPassed = onb && adp && pval && ret && bval;
    const status: CustomerOutcomeStatus = allPassed
      ? "ACHIEVED"
      : !ret || !pval
      ? "FAILED"
      : "PARTIALLY_ACHIEVED";

    return {
      customerId: inputs.customerId,
      onboardingVerified: onb,
      adoptionVerified: adp,
      productValueVerified: pval,
      retentionVerified: ret,
      businessValueVerified: bval,
      status,
      confidenceScore: allPassed ? 0.99 : 0.65,
      summary: allPassed
        ? `Customer outcome verified cleanly across all 5 dimensions (Onboarding, Adoption, Product Value, Retention, Business Value).`
        : `Customer outcome failed or partially degraded across one or more dimensions.`,
    };
  }
}
