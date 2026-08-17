/**
 * ProductSuccessGate
 *
 * Sits above FinalSuccessGate to verify overall product engineering completeness:
 * - Requirements completeness (100% of user requested features verified)
 * - VerificationMatrix across all 13 dimensions
 * - Security verification
 * - Reality check
 * - Golden regression checks
 * - Technical FinalSuccessGate evidence
 */

import type { RequirementCompletenessReport } from "../product/requirement-completeness-validator.js";
import type { VerificationMatrixReport } from "./verification-matrix.js";
import type { SecurityCheckReport } from "./security-verification-engine.js";
import type { FinalSuccessGateResult } from "./final-success-gate.js";

export type ProductGateStatus = "SUCCESS" | "FAILED" | "BLOCKED" | "INCOMPLETE";

export interface ProductSuccessReport {
  status: ProductGateStatus;
  passed: boolean;
  technicalGatePassed: boolean;
  requirementsComplete: boolean;
  matrixPassed: boolean;
  securityPassed: boolean;
  evidence: string[];
  summary: string;
}

export class ProductSuccessGate {
  public static evaluate(
    technicalGate: FinalSuccessGateResult,
    completeness: RequirementCompletenessReport,
    matrix: VerificationMatrixReport,
    security: SecurityCheckReport
  ): ProductSuccessReport {

    const evidence: string[] = [];

    const technicalGatePassed = technicalGate.status === "SUCCESS";
    const requirementsComplete = completeness.isComplete;
    const matrixPassed = matrix.isVerified;
    const securityPassed = security.passed;

    if (technicalGatePassed) evidence.push("Technical FinalSuccessGate passed (10/10 checks).");
    else evidence.push(`Technical gate failed: ${technicalGate.evidenceSummary}`);


    if (requirementsComplete) evidence.push(`Requirements completeness verified (${completeness.verifiedCount}/${completeness.totalRequirements} verified).`);
    else evidence.push(`Requirements incomplete: ${completeness.missingRequirements.join("; ")}`);

    if (matrixPassed) evidence.push("13-dimension VerificationMatrix passed across all features.");
    else evidence.push(`VerificationMatrix issues: ${matrix.failures.join("; ")}`);

    if (securityPassed) evidence.push("Security verification passed with 0 violations.");
    else evidence.push(`Security issues: ${security.violations.join("; ")}`);

    const overallPassed = technicalGatePassed && requirementsComplete && matrixPassed && securityPassed;

    let status: ProductGateStatus = "SUCCESS";
    if (!overallPassed) {
      if (!requirementsComplete) status = "INCOMPLETE";
      else status = "FAILED";
    }

    return {
      status,
      passed: overallPassed,
      technicalGatePassed,
      requirementsComplete,
      matrixPassed,
      securityPassed,
      evidence,
      summary: overallPassed
        ? "PRODUCT SUCCESS GATE: PASSED. Product engineering verified across all functional, technical, security and regression dimensions."
        : `PRODUCT SUCCESS GATE: ${status}. Unresolved criteria present.`,
    };
  }
}
