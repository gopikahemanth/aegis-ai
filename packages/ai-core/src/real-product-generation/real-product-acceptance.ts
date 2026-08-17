/**
 * RealProductAcceptanceEngine
 *
 * Enforces 12-point non-negotiable acceptance criteria.
 * One critical failure blocks the entire acceptance, regardless of aggregate score.
 * 97% complete + 1 critical defect = NOT ACCEPTED.
 */

export interface RealAcceptanceCriterion {
  name: string;
  isPassed: boolean;
  isCritical: boolean;
  evidence: string;
}

export interface RealProductAcceptanceResult {
  isAccepted: boolean;
  totalCriteria: number;
  passedCriteria: number;
  blockedBy: RealAcceptanceCriterion[];
  criteria: RealAcceptanceCriterion[];
  criticalDefectCount: number;
  overallScore: number;
  summary: string;
}

export class RealProductAcceptanceEngine {
  public static evaluate(opts: {
    requirementsCoverage: number;
    criticalFeaturesPassed: boolean;
    criticalWorkflowsPassed: boolean;
    databaseVerified: boolean;
    backendVerified: boolean;
    frontendVerified: boolean;
    authenticationVerified: boolean;
    authorizationVerified: boolean;
    uiUxPassed: boolean;
    responsivePassed: boolean;
    accessibilityPassed: boolean;
    criticalDefectCount: number;
  }): RealProductAcceptanceResult {
    const criteria: RealAcceptanceCriterion[] = [
      { name: "Requirements 100%", isPassed: opts.requirementsCoverage === 100, isCritical: true, evidence: `${opts.requirementsCoverage}% covered` },
      { name: "Critical Features 100%", isPassed: opts.criticalFeaturesPassed, isCritical: true, evidence: opts.criticalFeaturesPassed ? "All critical features verified" : "One or more critical features not accepted" },
      { name: "Critical Workflows 100%", isPassed: opts.criticalWorkflowsPassed, isCritical: true, evidence: opts.criticalWorkflowsPassed ? "All critical workflows verified" : "Workflow execution failures detected" },
      { name: "Database Verification PASS", isPassed: opts.databaseVerified, isCritical: true, evidence: opts.databaseVerified ? "Real CRUD persistence confirmed" : "Database persistence not verified" },
      { name: "Backend Verification PASS", isPassed: opts.backendVerified, isCritical: true, evidence: opts.backendVerified ? "All endpoints operational" : "Backend health check failed" },
      { name: "Frontend Verification PASS", isPassed: opts.frontendVerified, isCritical: true, evidence: opts.frontendVerified ? "App loads and routes resolve" : "Frontend failed to load" },
      { name: "Authentication PASS", isPassed: opts.authenticationVerified, isCritical: true, evidence: opts.authenticationVerified ? "Login/register/logout flow verified" : "Authentication flow broken" },
      { name: "Authorization PASS", isPassed: opts.authorizationVerified, isCritical: true, evidence: opts.authorizationVerified ? "RBAC role boundaries enforced" : "Authorization bypass detected" },
      { name: "UI/UX PASS", isPassed: opts.uiUxPassed, isCritical: false, evidence: opts.uiUxPassed ? "UI design system verified" : "UI/UX issues detected" },
      { name: "Responsive PASS", isPassed: opts.responsivePassed, isCritical: false, evidence: opts.responsivePassed ? "Multi-viewport layouts verified" : "Responsive layout issues" },
      { name: "Accessibility PASS", isPassed: opts.accessibilityPassed, isCritical: false, evidence: opts.accessibilityPassed ? "WCAG 2.1 AA compliance verified" : "Accessibility issues detected" },
      { name: "Critical Defects = 0", isPassed: opts.criticalDefectCount === 0, isCritical: true, evidence: `${opts.criticalDefectCount} critical defect(s)` },
    ];

    const blockedBy = criteria.filter((c) => !c.isPassed && c.isCritical);
    const passedCriteria = criteria.filter((c) => c.isPassed).length;
    const overallScore = Math.round((passedCriteria / criteria.length) * 100);
    const isAccepted = blockedBy.length === 0;

    return {
      isAccepted,
      totalCriteria: criteria.length,
      passedCriteria,
      blockedBy,
      criteria,
      criticalDefectCount: opts.criticalDefectCount,
      overallScore,
      summary: isAccepted
        ? `Product ACCEPTED: All 12 acceptance criteria passed. Score: ${overallScore}%. Zero critical defects.`
        : `Product NOT ACCEPTED: ${blockedBy.length} critical acceptance criterion/criteria failed: ${blockedBy.map((b) => b.name).join(", ")}.`,
    };
  }
}
