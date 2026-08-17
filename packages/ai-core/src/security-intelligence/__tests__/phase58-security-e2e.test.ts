import { describe, it, expect, beforeEach } from "vitest";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { SecurityIntelligenceEngine } from "../security-intelligence-engine.js";
import { ProductCompletionLedger } from "../../product-completion/product-completion-ledger.js";

describe("AEGIS Phase 58 — Master E2E Autonomous Product Security, Privacy & Trust Engineering", () => {
  const tmpBase = path.join(os.tmpdir(), "aegis-p58-e2e");

  beforeEach(() => {
    ProductCompletionLedger.reset();
    if (fs.existsSync(tmpBase)) {
      fs.rmSync(tmpBase, { recursive: true, force: true });
    }
    fs.mkdirSync(tmpBase, { recursive: true });
  });

  it("takes vulnerable gym application, discovers 5 vulnerabilities, safely repairs all, and certifies security acceptance", async () => {
    const projectPath = path.join(tmpBase, "gym-security-prod");
    fs.mkdirSync(projectPath, { recursive: true });

    // Execute Security Intelligence Engine (with 5 deliberate real-world vulnerabilities)
    const result = await SecurityIntelligenceEngine.executeSecurityAuditAndRemediation("GymMaster Pro", {
      projectPath,
      includeDeliberateVulnerabilities: true,
    });

    // 1. Lifecycle verification
    expect(result.lifecycle).toBe("SECURE_ACCEPTED");
    expect(result.productName).toBe("GymMaster Pro");

    // 2. Attack Surface Analysis
    expect(result.surface.totalEndpoints).toBeGreaterThanOrEqual(8);
    expect(result.surface.sensitiveFieldsDetected).toContain("passwordHash");

    // 3. Vulnerability Discovery & Classification
    expect(result.diagnosis.hasVulnerabilities).toBe(true);
    expect(result.diagnosis.totalFindings).toBe(5);
    expect(result.diagnosis.criticalCount).toBe(1); // Live secret key in frontend
    expect(result.diagnosis.highCount).toBe(2);     // Missing RBAC & data leak

    // 4. Autonomous Security Repair
    expect(result.repairReport?.isRepaired).toBe(true);
    expect(result.repairReport?.patchesAppliedCount).toBe(5);

    // 5. Multi-Layer Security Verification
    expect(result.verificationReport?.isFullyVerified).toBe(true);
    expect(result.verificationReport?.authorizationVerified).toBe(true);
    expect(result.verificationReport?.secretsEliminated).toBe(true);
    expect(result.verificationReport?.debugRoutesDisabled).toBe(true);

    // 6. Security Test Suite
    expect(result.testSuiteReport.isAllPassed).toBe(true);
    expect(result.testSuiteReport.totalTests).toBe(5);

    // 7. Security Acceptance & Gate
    expect(result.acceptance.isAccepted).toBe(true);
    expect(result.acceptance.criticalVulnerabilitiesCount).toBe(0);
    expect(result.certificate.tier).toBe(45);
    expect(result.certificate.status).toBe("SECURITY_ACCEPTED");

    // 8. Disk Certificate & Ledger Integrity
    const certPath = path.join(projectPath, ".aegis", "security-intelligence-certificate.json");
    expect(fs.existsSync(certPath)).toBe(true);
    const certOnDisk = JSON.parse(fs.readFileSync(certPath, "utf8"));
    expect(certOnDisk.status).toBe("SECURITY_ACCEPTED");
    expect(ProductCompletionLedger.verifyIntegrity()).toBe(true);
  });

  it("strictly blocks deployment and acceptance when unrepairable critical vulnerability is detected", async () => {
    const projectPath = path.join(tmpBase, "gym-security-blocked");
    fs.mkdirSync(projectPath, { recursive: true });

    const result = await SecurityIntelligenceEngine.executeSecurityAuditAndRemediation("GymMaster Pro", {
      projectPath,
      simulateUnrepairableCritical: true,
    });

    expect(result.lifecycle).toBe("ESCALATED_TO_HUMAN");
    expect(result.repairReport?.isRepaired).toBe(false);
    expect(result.repairReport?.requiresHumanIntervention).toBe(true);
    expect(result.acceptance.isAccepted).toBe(false);
    expect(result.certificate.status).toBe("SECURITY_REJECTED");
  });
});
