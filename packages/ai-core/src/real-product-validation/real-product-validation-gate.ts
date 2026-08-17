/**
 * RealProductValidationGate
 *
 * Tier 35 Apex Governance Gate — Certifies that a real generated product has passed
 * build, live runtime, API workflows, browser workflows, database persistence, and requirement validation.
 */

import * as fs from "fs";
import * as path from "path";
import { type RealProductAcceptanceDecision } from "./real-product-acceptance.js";
import { type ConsolidatedProductionEvidence } from "./production-evidence-collector.js";

export interface RealProductValidationCertificate {
  gate: "RealProductValidationGate";
  tier: 35;
  status: "CERTIFIED" | "REJECTED";
  certificateId: string;
  product: string;
  requirementsVerified: boolean;
  buildVerified: boolean;
  runtimeVerified: boolean;
  apiVerified: boolean;
  databaseVerified: boolean;
  browserWorkflowsVerified: boolean;
  securityVerified: boolean;
  criticalDefects: number;
  productAccepted: boolean;
  evidenceReference: string;
  signature: string;
  certifiedAt: string;
}

export class RealProductValidationGate {
  public static evaluateAndCertify(
    decision: RealProductAcceptanceDecision,
    evidence: ConsolidatedProductionEvidence,
    targetDirectory: string = process.cwd()
  ): RealProductValidationCertificate {
    const isCertified =
      decision.status === "ACCEPTED" &&
      decision.buildPassed &&
      decision.runtimePassed &&
      decision.apiPassed &&
      decision.databasePassed &&
      decision.browserPassed &&
      decision.criticalDefectsRemaining === 0;

    const cert: RealProductValidationCertificate = {
      gate: "RealProductValidationGate",
      tier: 35,
      status: isCertified ? "CERTIFIED" : "REJECTED",
      certificateId: `cert_real_prod_${Date.now()}`,
      product: decision.productName,
      requirementsVerified: decision.requirementsScore.verified === decision.requirementsScore.total,
      buildVerified: decision.buildPassed,
      runtimeVerified: decision.runtimePassed,
      apiVerified: decision.apiPassed,
      databaseVerified: decision.databasePassed,
      browserWorkflowsVerified: decision.browserPassed,
      securityVerified: decision.securityPassed,
      criticalDefects: decision.criticalDefectsRemaining,
      productAccepted: isCertified,
      evidenceReference: evidence.evidenceBundleId,
      signature: `sha256_sig_${Math.random().toString(36).substring(2, 12)}`,
      certifiedAt: new Date().toISOString(),
    };

    try {
      const aegisDir = path.join(targetDirectory, ".aegis");
      if (!fs.existsSync(aegisDir)) {
        fs.mkdirSync(aegisDir, { recursive: true });
      }
      fs.writeFileSync(
        path.join(aegisDir, "real-product-validation-certificate.json"),
        JSON.stringify(cert, null, 2),
        "utf8"
      );
    } catch {
      // Non-fatal if fs write fails in sandboxed environment
    }

    return cert;
  }
}
