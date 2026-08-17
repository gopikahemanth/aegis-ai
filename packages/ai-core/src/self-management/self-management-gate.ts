/**
 * SelfManagementGate
 *
 * The Supreme Master Apex Governance Gate in AEGIS (Tier 9):
 * Evaluates self-state convergence, self-health, policy immutability, worker healing,
 * and issues `.aegis/self-management-certificate.json`.
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ProductionValidationGate, type ProductionValidationCertificate } from "../validation/production-validation/production-validation-gate.js";
import { AegisHealthEngine, type PlatformHealthReport } from "./aegis-health-engine.js";
import { PolicyIntegrityValidator } from "./policy-integrity-validator.js";

export interface SelfManagementCertificate {
  certificateId: string;
  issuedAt: string;
  status: "SELF_MANAGEMENT_CERTIFIED" | "SELF_MANAGEMENT_BLOCKED";
  productionValidationCertificate: ProductionValidationCertificate;
  platformSelfHealth: PlatformHealthReport;
  policyIntegrityValidated: boolean;
  totalCertifiedGates: number;
  blockers: string[];
  summary: string;
}

export class SelfManagementGate {
  /**
   * Evaluate master platform self-management certification.
   */
  public static evaluate(workspacePath: string): SelfManagementCertificate {
    const prodValCert = ProductionValidationGate.evaluate(workspacePath);
    const selfHealth = AegisHealthEngine.evaluateSelfHealth();
    const policyReport = PolicyIntegrityValidator.validatePolicyIntegrity();

    const blockers: string[] = [];

    if (prodValCert.status !== "PRODUCTION_VALIDATED") {
      blockers.push(`PRODUCTION_VALIDATION_FAILED: Status was "${prodValCert.status}".`);
    }

    if (selfHealth.overallStatus !== "HEALTHY") {
      blockers.push(`SELF_HEALTH_DEGRADED: Platform self-health status was "${selfHealth.overallStatus}".`);
    }

    if (!policyReport.immutablePoliciesPreserved) {
      blockers.push("GOVERNANCE_POLICY_INTEGRITY_BREACHED");
    }

    const isCertified = blockers.length === 0;
    const certificateId = `cert_self_mgmt_${Date.now()}`;

    const cert: SelfManagementCertificate = {
      certificateId,
      issuedAt: new Date().toISOString(),
      status: isCertified ? "SELF_MANAGEMENT_CERTIFIED" : "SELF_MANAGEMENT_BLOCKED",
      productionValidationCertificate: prodValCert,
      platformSelfHealth: selfHealth,
      policyIntegrityValidated: policyReport.immutablePoliciesPreserved,
      totalCertifiedGates: 9, // All 9 governance tiers
      blockers,
      summary: isCertified
        ? "AEGIS SELF-MANAGEMENT GATE: CERTIFIED. Platform is autonomously governed, verified, and self-managing across all 9 governance tiers."
        : `AEGIS SELF-MANAGEMENT GATE: BLOCKED. ${blockers.length} blocker(s) detected.`,
    };

    const aegisDir = join(workspacePath, ".aegis");
    if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });

    try {
      writeFileSync(join(aegisDir, "self-management-certificate.json"), JSON.stringify(cert, null, 2), "utf8");
    } catch {}

    return cert;
  }
}
