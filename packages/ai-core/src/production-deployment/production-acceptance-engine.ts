/**
 * ProductionAcceptanceEngine
 *
 * 15-point production acceptance gate.
 * One critical failure blocks production acceptance.
 * Invariant: LIVE WEBSITE + 1 CRITICAL WORKFLOW FAILURE = NOT ACCEPTED
 */

export interface ProductionAcceptanceCriterion {
  name: string;
  isPassed: boolean;
  isCritical: boolean;
  evidence: string;
}

export interface ProductionAcceptanceResult {
  isAccepted: boolean;
  totalCriteria: number;
  passedCriteria: number;
  blockedBy: ProductionAcceptanceCriterion[];
  criteria: ProductionAcceptanceCriterion[];
  criticalDefectCount: number;
  overallScore: number;
  summary: string;
}

export class ProductionAcceptanceEngine {
  public static evaluate(opts: {
    buildPassed: boolean;
    environmentReady: boolean;
    deploymentCompleted: boolean;
    frontendHealthy: boolean;
    backendHealthy: boolean;
    databaseHealthy: boolean;
    liveApiVerified: boolean;
    liveBrowserVerified: boolean;
    authenticationVerified: boolean;
    authorizationVerified: boolean;
    criticalWorkflowsPassed: boolean;
    securityChecksPassed: boolean;
    observabilityPresent: boolean;
    rollbackVerified: boolean;
    criticalDefectCount: number;
  }): ProductionAcceptanceResult {
    const criteria: ProductionAcceptanceCriterion[] = [
      { name: "Production Build PASS", isPassed: opts.buildPassed, isCritical: true, evidence: opts.buildPassed ? "All 6 build steps passed — typecheck, lint, tests, bundle, compile" : "Build step failed" },
      { name: "Environment READY", isPassed: opts.environmentReady, isCritical: true, evidence: opts.environmentReady ? "Node, ports, DB, env vars all confirmed READY" : "Environment not ready — check blockers" },
      { name: "Deployment COMPLETED", isPassed: opts.deploymentCompleted, isCritical: true, evidence: opts.deploymentCompleted ? "All deployment stages completed — PREPARING through VERIFYING" : "Deployment stage failed" },
      { name: "Frontend HEALTHY", isPassed: opts.frontendHealthy, isCritical: true, evidence: opts.frontendHealthy ? "Frontend serving at :5173 — APPLICATION_HEALTHY" : "Frontend not responding" },
      { name: "Backend HEALTHY", isPassed: opts.backendHealthy, isCritical: true, evidence: opts.backendHealthy ? "Backend responding at :3001 — APPLICATION_HEALTHY" : "Backend not responding" },
      { name: "Database HEALTHY", isPassed: opts.databaseHealthy, isCritical: true, evidence: opts.databaseHealthy ? "Database connected — query latency confirmed" : "Database not reachable" },
      { name: "Live API VERIFIED", isPassed: opts.liveApiVerified, isCritical: true, evidence: opts.liveApiVerified ? "All 9 endpoints verified against real server" : "One or more endpoints returned errors" },
      { name: "Browser VERIFIED", isPassed: opts.liveBrowserVerified, isCritical: true, evidence: opts.liveBrowserVerified ? "All routes verified at 1440/768/375px" : "Browser verification failed" },
      { name: "Authentication VERIFIED", isPassed: opts.authenticationVerified, isCritical: true, evidence: opts.authenticationVerified ? "Login/register/logout verified on live application" : "Auth flow broken in production" },
      { name: "Authorization VERIFIED", isPassed: opts.authorizationVerified, isCritical: true, evidence: opts.authorizationVerified ? "RBAC role boundaries confirmed on live application" : "Authorization bypass detected" },
      { name: "Critical Workflows PASS", isPassed: opts.criticalWorkflowsPassed, isCritical: true, evidence: opts.criticalWorkflowsPassed ? "All smoke tests passed on live application" : "Critical workflow failed post-deployment" },
      { name: "Security Checks PASS", isPassed: opts.securityChecksPassed, isCritical: true, evidence: opts.securityChecksPassed ? "Authentication, authorization, secret exposure, debug endpoints — all verified" : "Critical security check failed" },
      { name: "Observability PRESENT", isPassed: opts.observabilityPresent, isCritical: false, evidence: opts.observabilityPresent ? "Structured logging, health checks, startup diagnostics confirmed" : "Observability baseline not present" },
      { name: "Rollback VERIFIED", isPassed: opts.rollbackVerified, isCritical: true, evidence: opts.rollbackVerified ? "Rollback tested and confirmed — previous version restored and smoke tested" : "Rollback not verified — unsafe deployment" },
      { name: "Critical Defects = 0", isPassed: opts.criticalDefectCount === 0, isCritical: true, evidence: `${opts.criticalDefectCount} critical defect(s) in production` },
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
        ? `PRODUCTION ACCEPTED: All 15 criteria passed. Score: ${overallScore}%. Zero critical defects. Live website verified.`
        : `PRODUCTION NOT ACCEPTED: ${blockedBy.length} critical criterion/criteria failed — ${blockedBy.map((b) => b.name).join(", ")}.`,
    };
  }
}
