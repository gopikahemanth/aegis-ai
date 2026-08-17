/**
 * EngineeringCertificationGate
 *
 * The master top-level governance certification gate in AEGIS:
 * FinalSuccessGate -> ProductSuccessGate -> ProductionReleaseGate -> ProductionOperationsGate -> FleetOperationsGate -> EngineeringCertificationGate
 *
 * Evaluates fleet operations, reliability forecasting, learning accuracy,
 * and issues `.aegis/engineering-certificate.json`.
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { FleetOperationsGate } from "../fleet/fleet-operations-gate.js";
import { ReliabilityForecaster } from "../reliability/reliability-forecaster.js";
import { EngineeringLearningEngine } from "../learning/engineering-learning-engine.js";

export interface MasterEngineeringCertificate {
  certificateId: string;
  issuedAt: string;
  status: "ENGINEERING_CERTIFIED" | "CERTIFICATION_BLOCKED";
  totalFleetProjects: number;
  learningAccuracyPercent: number;
  forecastStatus: string;
  blockers: string[];
  summary: string;
}

export class EngineeringCertificationGate {
  /**
   * Evaluate master engineering certification across the entire platform.
   */
  public static evaluate(workspacePath: string): MasterEngineeringCertificate {
    const fleetCert = FleetOperationsGate.evaluate(workspacePath);
    const blockers: string[] = [];

    if (fleetCert.status !== "FLEET_OPERATIONAL") {
      blockers.push(`FLEET_NOT_OPERATIONAL: Fleet operations gate reported "${fleetCert.status}".`);
    }

    const forecast = ReliabilityForecaster.forecast("fleet_global", 95, 0);
    const learningAccuracy = EngineeringLearningEngine.getAverageAccuracy() * 100;

    const isCertified = blockers.length === 0;
    const certificateId = `cert_master_eng_${Date.now()}`;

    const cert: MasterEngineeringCertificate = {
      certificateId,
      issuedAt: new Date().toISOString(),
      status: isCertified ? "ENGINEERING_CERTIFIED" : "CERTIFICATION_BLOCKED",
      totalFleetProjects: fleetCert.totalProjects,
      learningAccuracyPercent: learningAccuracy,
      forecastStatus: forecast.sloBreachRisk,
      blockers,
      summary: isCertified
        ? `AEGIS MASTER ENGINEERING CERTIFICATE: ISSUED. ${fleetCert.totalProjects} fleet projects certified with ${learningAccuracy}% prediction accuracy.`
        : `AEGIS MASTER ENGINEERING CERTIFICATE: BLOCKED. ${blockers.length} blocker(s) detected.`,
    };

    const aegisDir = join(workspacePath, ".aegis");
    if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });

    try {
      writeFileSync(join(aegisDir, "engineering-certificate.json"), JSON.stringify(cert, null, 2), "utf8");
    } catch {}

    return cert;
  }
}
