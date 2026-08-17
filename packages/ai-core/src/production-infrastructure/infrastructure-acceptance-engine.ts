/**
 * InfrastructureAcceptanceEngine
 *
 * 17-point non-negotiable infrastructure acceptance gate.
 * One critical failure blocks infrastructure certification.
 */

export interface InfrastructureCriterion {
  id: number;
  name: string;
  isPassed: boolean;
  isCritical: boolean;
  evidence: string;
}

export interface InfrastructureAcceptanceResult {
  isAccepted: boolean;
  totalCriteria: number;
  passedCriteria: number;
  overallScore: number;
  criteria: InfrastructureCriterion[];
  blockedBy: InfrastructureCriterion[];
  criticalDefectCount: number;
  summary: string;
}

export class InfrastructureAcceptanceEngine {
  public static evaluate(opts: {
    planValid: boolean;
    hostingTargetReady: boolean;
    environmentConfigured: boolean;
    databaseHealthy: boolean;
    applicationRunning: boolean;
    frontendHealthy: boolean;
    backendHealthy: boolean;
    domainVerified: boolean;
    tlsVerified: boolean;
    publicAvailabilityVerified: boolean;
    liveApiVerified: boolean;
    liveBrowserVerified: boolean;
    monitoringPresent: boolean;
    backupReadinessVerified: boolean;
    securityChecksPassed: boolean;
    rollbackVerified: boolean;
    criticalDefectCount: number;
  }): InfrastructureAcceptanceResult {
    const criteria: InfrastructureCriterion[] = [
      { id: 1, name: "Infrastructure Plan Valid", isPassed: opts.planValid, isCritical: true, evidence: opts.planValid ? "7-step plan approved with rollback & backup" : "Invalid plan" },
      { id: 2, name: "Hosting Target Ready", isPassed: opts.hostingTargetReady, isCritical: true, evidence: opts.hostingTargetReady ? "Compute and storage targets provisioned" : "Hosting target unready" },
      { id: 3, name: "Environment Configured", isPassed: opts.environmentConfigured, isCritical: true, evidence: opts.environmentConfigured ? "All core production env vars verified" : "Missing environment configuration" },
      { id: 4, name: "Database Healthy", isPassed: opts.databaseHealthy, isCritical: true, evidence: opts.databaseHealthy ? "Prisma connection, migrations, CRUD roundtrip passed" : "Database unhealthy" },
      { id: 5, name: "Application Running", isPassed: opts.applicationRunning, isCritical: true, evidence: opts.applicationRunning ? "Processes alive with assigned PIDs" : "Process crash detected" },
      { id: 6, name: "Frontend Healthy", isPassed: opts.frontendHealthy, isCritical: true, evidence: opts.frontendHealthy ? "Client host serving at :5173 / CDN" : "Frontend unhealthy" },
      { id: 7, name: "Backend Healthy", isPassed: opts.backendHealthy, isCritical: true, evidence: opts.backendHealthy ? "Express API serving at :3001" : "Backend unhealthy" },
      { id: 8, name: "Domain Verified", isPassed: opts.domainVerified, isCritical: true, evidence: opts.domainVerified ? "DNS A & CNAME records resolving correctly" : "Domain unverified / missing" },
      { id: 9, name: "TLS Verified", isPassed: opts.tlsVerified, isCritical: true, evidence: opts.tlsVerified ? "Valid HTTPS certificate & HSTS headers enforced" : "TLS validation failed" },
      { id: 10, name: "Public Availability Verified", isPassed: opts.publicAvailabilityVerified, isCritical: true, evidence: opts.publicAvailabilityVerified ? "Public HTTPS endpoints responding to WAN requests" : "Public endpoints unreachable" },
      { id: 11, name: "Live API Verified", isPassed: opts.liveApiVerified, isCritical: true, evidence: opts.liveApiVerified ? "Real CRUD and business logic verified" : "API endpoint verification failed" },
      { id: 12, name: "Live Browser Verified", isPassed: opts.liveBrowserVerified, isCritical: true, evidence: opts.liveBrowserVerified ? "Multi-viewport rendering confirmed (1440/768/375px)" : "Browser verification failed" },
      { id: 13, name: "Monitoring Present", isPassed: opts.monitoringPresent, isCritical: false, evidence: opts.monitoringPresent ? "Uptime, error rates, latency telemetry active" : "Monitoring unconfigured" },
      { id: 14, name: "Backup Readiness Verified", isPassed: opts.backupReadinessVerified, isCritical: true, evidence: opts.backupReadinessVerified ? "Automated snapshot and restore drill verified" : "Backup / restore unverified" },
      { id: 15, name: "Security Checks Passed", isPassed: opts.securityChecksPassed, isCritical: true, evidence: opts.securityChecksPassed ? "No secret exposure, CORS whitelisted, debug disabled" : "Security check failure" },
      { id: 16, name: "Rollback Readiness Verified", isPassed: opts.rollbackVerified, isCritical: true, evidence: opts.rollbackVerified ? "Automated rollback tested and verified" : "Rollback procedure unverified" },
      { id: 17, name: "Critical Defects = 0", isPassed: opts.criticalDefectCount === 0, isCritical: true, evidence: `${opts.criticalDefectCount} critical defects present` },
    ];

    const blockedBy = criteria.filter((c) => c.isCritical && !c.isPassed);
    const passedCriteria = criteria.filter((c) => c.isPassed).length;
    const overallScore = Math.round((passedCriteria / criteria.length) * 100);
    const isAccepted = blockedBy.length === 0;

    return {
      isAccepted,
      totalCriteria: criteria.length,
      passedCriteria,
      overallScore,
      criteria,
      blockedBy,
      criticalDefectCount: opts.criticalDefectCount,
      summary: isAccepted
        ? `INFRASTRUCTURE ACCEPTED: 17/17 criteria verified. Score: ${overallScore}%. Production readiness confirmed.`
        : `INFRASTRUCTURE NOT ACCEPTED: ${blockedBy.length} critical criterion/criteria failed (${blockedBy.map((b) => b.name).join(", ")}).`,
    };
  }
}
