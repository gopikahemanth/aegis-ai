/**
 * BusinessContinuityImpactEngine
 *
 * Correlates technical component degradation with enterprise business outcomes.
 */

export interface ContinuityImpactAssessment {
  assessmentId: string;
  projectId: string;
  businessCapability: string;
  customerImpactSeverity: "NONE" | "LOW" | "MODERATE" | "SEVERE" | "CATASTROPHIC";
  financialExposureINR: number;
  complianceExposure: boolean;
  classification: "FORECAST" | "OBSERVED" | "VERIFIED";
  summary: string;
}

export class BusinessContinuityImpactEngine {
  public static assessImpact(
    projectId: string,
    capability: string,
    affectedCustomers: number,
    classification: ContinuityImpactAssessment["classification"] = "OBSERVED"
  ): ContinuityImpactAssessment {
    let severity: ContinuityImpactAssessment["customerImpactSeverity"] = "LOW";
    if (affectedCustomers > 5000) severity = "SEVERE";
    else if (affectedCustomers > 500) severity = "MODERATE";

    const exposure = Math.round(affectedCustomers * 125);

    return {
      assessmentId: `cont_imp_${Date.now()}`,
      projectId,
      businessCapability: capability,
      customerImpactSeverity: severity,
      financialExposureINR: exposure,
      complianceExposure: false,
      classification,
      summary: `Capability "${capability}" evaluated: ${affectedCustomers} customers affected, ₹${exposure} financial exposure (${classification}).`,
    };
  }
}
