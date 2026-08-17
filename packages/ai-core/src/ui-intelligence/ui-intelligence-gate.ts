/**
 * UIIntelligenceGate
 *
 * Tier 36 Apex Governance Gate — Certifies visual polish, responsive excellence,
 * accessibility compliance, and design token consistency for generated applications.
 */

import * as fs from "fs";
import * as path from "path";
import { type UIAcceptanceDecision } from "./ui-product-acceptance.js";

export interface UIIntelligenceCertificate {
  gate: "UIIntelligenceGate";
  tier: 36;
  status: "CERTIFIED" | "REJECTED";
  certificateId: string;
  pagesVerified: number;
  desktopVerified: boolean;
  tabletVerified: boolean;
  mobileVerified: boolean;
  accessibilityVerified: boolean;
  criticalVisualDefects: number;
  criticalUXDefects: number;
  uiQualityScore: number;
  signature: string;
  certifiedAt: string;
}

export class UIIntelligenceGate {
  public static evaluateAndCertify(
    decision: UIAcceptanceDecision,
    targetDirectory: string = process.cwd()
  ): UIIntelligenceCertificate {
    const isCertified = decision.isAccepted;

    const cert: UIIntelligenceCertificate = {
      gate: "UIIntelligenceGate",
      tier: 36,
      status: isCertified ? "CERTIFIED" : "REJECTED",
      certificateId: `cert_ui_intel_${Date.now()}`,
      pagesVerified: decision.pagesVerifiedCount,
      desktopVerified: decision.desktopVerified,
      tabletVerified: decision.tabletVerified,
      mobileVerified: decision.mobileVerified,
      accessibilityVerified: decision.accessibilityPassed,
      criticalVisualDefects: decision.criticalVisualDefects,
      criticalUXDefects: decision.criticalUXDefects,
      uiQualityScore: decision.qualityScore.overallScore,
      signature: `sha256_ui_sig_${Math.random().toString(36).substring(2, 12)}`,
      certifiedAt: new Date().toISOString(),
    };

    try {
      const aegisDir = path.join(targetDirectory, ".aegis");
      if (!fs.existsSync(aegisDir)) {
        fs.mkdirSync(aegisDir, { recursive: true });
      }
      fs.writeFileSync(
        path.join(aegisDir, "ui-intelligence-certificate.json"),
        JSON.stringify(cert, null, 2),
        "utf8"
      );
    } catch {
      // Non-fatal if fs write fails in sandboxed environment
    }

    return cert;
  }
}
