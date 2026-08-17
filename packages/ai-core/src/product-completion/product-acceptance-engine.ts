/**
 * ProductAcceptanceEngine
 *
 * Final product acceptance engine determining whether a generated product meets all 100% completion criteria.
 * Hard Invariants:
 * - BUILD PASS != PRODUCT COMPLETE
 * - TEST PASS != PRODUCT COMPLETE
 * - DEPLOYMENT SUCCESS != PRODUCT COMPLETE
 */

export type ProductAcceptanceStatus =
  | "INCOMPLETE"
  | "PARTIALLY_COMPLETE"
  | "VERIFICATION_REQUIRED"
  | "REPAIR_REQUIRED"
  | "READY_FOR_ACCEPTANCE"
  | "ACCEPTED"
  | "REJECTED";

export interface ProductAcceptanceReport {
  status: ProductAcceptanceStatus;
  isAccepted: boolean;
  totalRequirementsCount: number;
  verifiedRequirementsCount: number;
  criticalRequirementsVerified: boolean;
  criticalDefectsRemaining: number;
  buildPassed: boolean;
  runtimePassed: boolean;
  browserWorkflowsPassed: boolean;
  apiVerified: boolean;
  databaseVerified: boolean;
  securityGatePassed: boolean;
  blockers: string[];
  summary: string;
}

export class ProductAcceptanceEngine {
  public static evaluateAcceptance(
    totalReqs: number,
    verifiedReqs: number,
    criticalReqsVerified: boolean,
    unresolvedCriticalDefects: number,
    buildPassed: boolean,
    runtimePassed: boolean,
    browserPassed: boolean,
    apiVerified: boolean,
    dbVerified: boolean,
    secGatePassed: boolean
  ): ProductAcceptanceReport {
    const blockers: string[] = [];

    if (totalReqs === 0) blockers.push("Requirement contract is empty.");
    if (verifiedReqs < totalReqs) blockers.push(`Only ${verifiedReqs}/${totalReqs} requirements verified.`);
    if (!criticalReqsVerified) blockers.push("Critical functional requirements remain unverified.");
    if (unresolvedCriticalDefects > 0) blockers.push(`${unresolvedCriticalDefects} critical defect(s) unresolved.`);
    if (!buildPassed) blockers.push("TypeScript/Vite build failed.");
    if (!runtimePassed) blockers.push("Application failed to boot up and serve traffic.");
    if (!browserPassed) blockers.push("Browser workflow tests failed.");
    if (!apiVerified) blockers.push("API endpoint contracts failed validation.");
    if (!dbVerified) blockers.push("Database schema/migration verification failed.");
    if (!secGatePassed) blockers.push("Security verification gate failed.");

    const isAccepted = blockers.length === 0;
    let status: ProductAcceptanceStatus = "ACCEPTED";

    if (!isAccepted) {
      if (unresolvedCriticalDefects > 0) {
        status = "REPAIR_REQUIRED";
      } else if (verifiedReqs === 0) {
        status = "INCOMPLETE";
      } else {
        status = "VERIFICATION_REQUIRED";
      }
    }

    return {
      status,
      isAccepted,
      totalRequirementsCount: totalReqs,
      verifiedRequirementsCount: verifiedReqs,
      criticalRequirementsVerified: criticalReqsVerified,
      criticalDefectsRemaining: unresolvedCriticalDefects,
      buildPassed,
      runtimePassed,
      browserWorkflowsPassed: browserPassed,
      apiVerified,
      databaseVerified: dbVerified,
      securityGatePassed: secGatePassed,
      blockers,
      summary: isAccepted
        ? `Product ACCEPTED: 100% of ${totalReqs} requirements verified across UI, API, DB, runtime, and browser workflows with 0 critical defects.`
        : `Product NOT ACCEPTED (${status}): ${blockers.length} blocker(s) detected.`,
    };
  }
}
