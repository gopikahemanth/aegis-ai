import { describe, it, expect, beforeEach } from "vitest";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { ProductionInfrastructureEngine } from "../production-infrastructure-engine.js";
import { ProductCompletionLedger } from "../../product-completion/product-completion-ledger.js";

describe("AEGIS Phase 54 — Master E2E Production Infrastructure", () => {
  const tmpBase = path.join(os.tmpdir(), "aegis-p54-e2e");

  beforeEach(() => {
    ProductCompletionLedger.reset();
    if (fs.existsSync(tmpBase)) {
      fs.rmSync(tmpBase, { recursive: true, force: true });
    }
    fs.mkdirSync(tmpBase, { recursive: true });
  });

  it("completes full end-to-end production infrastructure provisioning for accepted product", async () => {
    const projectPath = path.join(tmpBase, "gym-infra-prod");
    fs.mkdirSync(projectPath, { recursive: true });

    // Execute Master Production Infrastructure Engine
    const result = await ProductionInfrastructureEngine.provisionInfrastructure("GymMaster Pro", {
      projectPath,
      domain: "aegisgym.com",
      targetType: "CLOUD",
      credentials: { AWS_ACCESS_KEY_ID: "AKIA_PROD_123" },
    });

    // 1. Lifecycle verification
    expect(result.lifecycle).toBe("READY");
    expect(result.publicUrl).toBe("https://aegisgym.com");

    // 2. Target & Plan
    expect(result.target.type).toBe("CLOUD");
    expect(result.plan.steps).toHaveLength(7);
    expect(result.plan.rollbackStrategy).toBe("PREVIOUS_INFRASTRUCTURE_STATE_RESTORE");

    // 3. Environment & Database
    expect(result.environment.isConfigured).toBe(true);
    expect(result.database.isDatabaseReady).toBe(true);
    expect(result.database.isRecoveryReady).toBe(true);

    // 4. Runtime & Hosting
    expect(result.hosting.isHealthy).toBe(true);

    // 5. Domain & TLS
    expect(result.domainReport.isDomainVerified).toBe(true);
    expect(result.tls.isTlsVerified).toBe(true);

    // 6. Public Availability & Live Endpoints
    expect(result.publicAvailability.isPubliclyAvailable).toBe(true);
    expect(result.publicAvailability.dnsResolved).toBe(true);
    expect(result.publicAvailability.httpsResponding).toBe(true);

    // 7. Monitoring, Backup & Security
    expect(result.monitoring.isMonitoringActive).toBe(true);
    expect(result.backup.isRestoreVerified).toBe(true);
    expect(result.security.isSecure).toBe(true);

    // 8. 17-Point Acceptance & Tier 41 Certificate
    expect(result.acceptance.isAccepted).toBe(true);
    expect(result.acceptance.criticalDefectCount).toBe(0);
    expect(result.certificate.tier).toBe(41);
    expect(result.certificate.status).toBe("INFRASTRUCTURE_ACCEPTED");
    expect(result.certificate.evidence.domainVerified).toBe(true);
    expect(result.certificate.evidence.tlsVerified).toBe(true);
    expect(result.certificate.evidence.publicAvailabilityVerified).toBe(true);
    expect(result.certificate.evidence.backupReadinessVerified).toBe(true);

    // 9. Ledger and certificate disk persistence
    const certPath = path.join(projectPath, ".aegis", "production-infrastructure-certificate.json");
    expect(fs.existsSync(certPath)).toBe(true);
    const certOnDisk = JSON.parse(fs.readFileSync(certPath, "utf8"));
    expect(certOnDisk.status).toBe("INFRASTRUCTURE_ACCEPTED");
    expect(ProductCompletionLedger.verifyIntegrity()).toBe(true);
  });

  it("handles missing domain without false success — DOMAIN_CONFIGURATION_REQUIRED", async () => {
    const projectPath = path.join(tmpBase, "gym-infra-nodomain");
    fs.mkdirSync(projectPath, { recursive: true });

    const result = await ProductionInfrastructureEngine.provisionInfrastructure("GymMaster Pro", {
      projectPath,
      domain: "",
      simulateFailureAt: "DOMAIN",
    });

    expect(result.domainReport.isDomainVerified).toBe(false);
    expect(result.domainReport.state).toBe("DOMAIN_CONFIGURATION_REQUIRED");
    expect(result.acceptance.isAccepted).toBe(false);
    expect(result.certificate.status).toBe("INFRASTRUCTURE_REJECTED");
  });

  it("blocks deployment when TLS validation fails", async () => {
    const projectPath = path.join(tmpBase, "gym-infra-badtls");
    fs.mkdirSync(projectPath, { recursive: true });

    const result = await ProductionInfrastructureEngine.provisionInfrastructure("GymMaster Pro", {
      projectPath,
      domain: "aegisgym.com",
      simulateFailureAt: "TLS",
    });

    expect(result.tls.isTlsVerified).toBe(false);
    expect(result.tls.state).toBe("TLS_FAILED");
    expect(result.acceptance.isAccepted).toBe(false);
    expect(result.certificate.status).toBe("INFRASTRUCTURE_REJECTED");
  });

  it("detects public website failure, triggers rollback, and verifies return to safe state", async () => {
    const projectPath = path.join(tmpBase, "gym-infra-rollback");
    fs.mkdirSync(projectPath, { recursive: true });

    const result = await ProductionInfrastructureEngine.provisionInfrastructure("GymMaster Pro", {
      projectPath,
      domain: "aegisgym.com",
      simulateFailureAt: "PUBLIC",
    });

    expect(result.lifecycle).toBe("ROLLED_BACK");
    expect(result.publicAvailability.isPubliclyAvailable).toBe(false);
    expect(result.rollback).toBeDefined();
    expect(result.rollback?.isRollbackVerified).toBe(true);
    expect(result.rollback?.finalState).toBe("ROLLBACK_VERIFIED");
    expect(result.rollback?.publicAvailabilityVerified).toBe(true);
    expect(result.acceptance.isAccepted).toBe(false);
    expect(result.certificate.status).toBe("INFRASTRUCTURE_REJECTED");
  });
});
