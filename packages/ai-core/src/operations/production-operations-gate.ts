/**
 * ProductionOperationsGate
 *
 * The authoritative top-level gate in the AEGIS governance hierarchy:
 * FinalSuccessGate -> ProductSuccessGate -> ProductionReleaseGate -> ProductionOperationsGate
 *
 * Validates continuous operational readiness, health probes, incident state,
 * and generates `.aegis/operations-certificate.json`.
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { ReleaseCertificate } from "../production/production-release-gate.js";
import { ProductionHealthMonitor, type ProductionHealthReport } from "./production-health-monitor.js";
import { IncidentEngine } from "./incident-engine.js";
import { DeploymentInventory } from "./deployment-inventory.js";
import type { EnvironmentType } from "./production-state.js";

export interface OperationsCertificate {
  certificateId: string;
  projectId: string;
  environment: EnvironmentType;
  releaseId: string;
  generationId: string;
  issuedAt: string;
  status: "SUCCESS" | "DEGRADED" | "BLOCKED" | "UNKNOWN";
  healthReport: ProductionHealthReport;
  activeIncidentsCount: number;
  blockers: string[];
  summary: string;
}

export interface ProductionOperationsEvaluationRequest {
  projectPath: string;
  projectId: string;
  environment: EnvironmentType;
  releaseCertificate: ReleaseCertificate;
  liveServerUrl?: string;
}

export class ProductionOperationsGate {
  /**
   * Evaluate complete continuous production operations readiness.
   */
  public static async evaluate(req: ProductionOperationsEvaluationRequest): Promise<OperationsCertificate> {
    const blockers: string[] = [];

    // 1. Verify Release Certificate is RELEASED
    if (req.releaseCertificate.status !== "RELEASED") {
      blockers.push(`RELEASE_GATE_NOT_PASSED: Release certificate status is "${req.releaseCertificate.status}".`);
    }

    // 2. Evaluate Continuous Health
    const healthReport = await ProductionHealthMonitor.evaluateHealth(
      req.projectId,
      req.environment,
      req.liveServerUrl
    );

    if (healthReport.overallStatus === "UNAVAILABLE") {
      blockers.push("HEALTH_CHECK_FAILED: One or more critical runtime components are UNAVAILABLE.");
    } else if (healthReport.overallStatus === "UNKNOWN") {
      blockers.push("HEALTH_CHECK_UNKNOWN: Telemetry missing. UNKNOWN status cannot be approved.");
    }

    // 3. Check for Active Critical Incidents
    const activeIncidents = IncidentEngine.listIncidents(req.projectId).filter(
      (i) => i.environment === req.environment && i.status !== "RESOLVED" && i.severity === "CRITICAL"
    );

    if (activeIncidents.length > 0) {
      blockers.push(`ACTIVE_CRITICAL_INCIDENTS: Found ${activeIncidents.length} unresolved critical incident(s).`);
    }

    // Determine final status
    let status: OperationsCertificate["status"] = "SUCCESS";
    if (blockers.length > 0) {
      status = "BLOCKED";
    } else if (healthReport.overallStatus === "DEGRADED") {
      status = "DEGRADED";
    }

    const certificateId = `cert_ops_${Date.now()}_${req.releaseCertificate.generationId}`;

    const cert: OperationsCertificate = {
      certificateId,
      projectId: req.projectId,
      environment: req.environment,
      releaseId: req.releaseCertificate.releaseId,
      generationId: req.releaseCertificate.generationId,
      issuedAt: new Date().toISOString(),
      status,
      healthReport,
      activeIncidentsCount: activeIncidents.length,
      blockers,
      summary:
        status === "SUCCESS"
          ? `AEGIS PRODUCTION OPERATIONS GATE: PASSED. Operations certificate "${certificateId}" issued.`
          : `AEGIS PRODUCTION OPERATIONS GATE: BLOCKED. ${blockers.length} blocker(s) detected.`,
    };

    // Persist to .aegis/operations-certificate.json
    const aegisDir = join(req.projectPath, ".aegis");
    if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });

    try {
      writeFileSync(join(aegisDir, "operations-certificate.json"), JSON.stringify(cert, null, 2), "utf8");
    } catch {}

    return cert;
  }
}
