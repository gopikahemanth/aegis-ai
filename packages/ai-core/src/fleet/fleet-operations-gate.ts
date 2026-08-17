/**
 * FleetOperationsGate
 *
 * Evaluates organization-wide operations health and certifies multi-project fleet reliability.
 * Generates `.aegis/fleet-operations-certificate.json`.
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { FleetManager, type FleetHealthSummary } from "./fleet-manager.js";

export interface FleetOperationsCertificate {
  certificateId: string;
  issuedAt: string;
  status: "FLEET_OPERATIONAL" | "FLEET_DEGRADED" | "FLEET_BLOCKED";
  fleetHealth: FleetHealthSummary;
  totalProjects: number;
  blockers: string[];
  summary: string;
}

export class FleetOperationsGate {
  /**
   * Evaluate fleet operations readiness.
   */
  public static evaluate(workspacePath: string): FleetOperationsCertificate {
    const fleetHealth = FleetManager.getFleetHealth();
    const blockers: string[] = [];

    if (fleetHealth.atRiskProjects > fleetHealth.totalProjects * 0.5 && fleetHealth.totalProjects > 0) {
      blockers.push("FLEET_UNHEALTHY: Majority of fleet projects are at risk.");
    }

    const isPassed = blockers.length === 0;
    const certificateId = `cert_fleet_${Date.now()}`;

    const cert: FleetOperationsCertificate = {
      certificateId,
      issuedAt: new Date().toISOString(),
      status: isPassed ? "FLEET_OPERATIONAL" : "FLEET_BLOCKED",
      fleetHealth,
      totalProjects: fleetHealth.totalProjects,
      blockers,
      summary: isPassed
        ? `AEGIS FLEET OPERATIONS GATE: PASSED. ${fleetHealth.totalProjects} project(s) certified operational.`
        : `AEGIS FLEET OPERATIONS GATE: BLOCKED. ${blockers.length} blocker(s) detected.`,
    };

    const aegisDir = join(workspacePath, ".aegis");
    if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });

    try {
      writeFileSync(join(aegisDir, "fleet-operations-certificate.json"), JSON.stringify(cert, null, 2), "utf8");
    } catch {}

    return cert;
  }
}
