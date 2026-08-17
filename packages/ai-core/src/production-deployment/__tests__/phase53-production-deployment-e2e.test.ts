import { describe, it, expect, beforeEach } from "vitest";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { ProductionDeploymentEngine } from "../production-deployment-engine.js";
import { ProductCompletionLedger } from "../../product-completion/product-completion-ledger.js";

describe("AEGIS Phase 53 — Master E2E Production Deployment", () => {
  const tmpBase = path.join(os.tmpdir(), "aegis-p53-e2e");

  beforeEach(() => {
    ProductCompletionLedger.reset();
    if (fs.existsSync(tmpBase)) {
      fs.rmSync(tmpBase, { recursive: true, force: true });
    }
    fs.mkdirSync(tmpBase, { recursive: true });
  });

  it("completes full end-to-end production deployment for an accepted product", async () => {
    const projectPath = path.join(tmpBase, "gym-management-prod");
    fs.mkdirSync(projectPath, { recursive: true });

    // Execute Master Production Deployment Engine
    const result = await ProductionDeploymentEngine.deploy("GymMaster Pro", projectPath);

    // 1. Lifecycle verification
    expect(result.lifecycle).toBe("PRODUCTION_DELIVERED");
    expect(result.deployedUrl).toBe("http://localhost:3001");

    // 2. Preflight & Environment readiness
    expect(result.environment.isDeployable).toBe(true);
    expect(result.configuration.isReady).toBe(true);

    // 3. Deployment Plan & Rollback readiness
    expect(result.plan.rollbackStrategy).toBe("PREVIOUS_BUILD_RESTORE");
    expect(result.build.isPassed).toBe(true);
    expect(result.deployment.isCompleted).toBe(true);

    // 4. Live Health & Endpoint Validation
    expect(result.health.isApplicationHealthy).toBe(true);
    expect(result.liveApi.isAllVerified).toBe(true);
    expect(result.liveBrowser.isAllVerified).toBe(true);

    // 5. Smoke Tests & Business Workflows
    expect(result.smokeTests.isAllPassed).toBe(true);
    expect(result.smokeTests.passedTests).toBe(result.smokeTests.totalTests);

    // 6. Security & Observability
    expect(result.security.isProductionSafe).toBe(true);
    expect(result.observability.isBaselinePresent).toBe(true);

    // 7. Acceptance & Tier 40 Certificate
    expect(result.acceptance.isAccepted).toBe(true);
    expect(result.acceptance.criticalDefectCount).toBe(0);
    expect(result.certificate.tier).toBe(40);
    expect(result.certificate.status).toBe("PRODUCTION_ACCEPTED");
    expect(result.certificate.evidence.liveApiVerified).toBe(true);
    expect(result.certificate.evidence.liveBrowserVerified).toBe(true);
    expect(result.certificate.evidence.criticalWorkflowsVerified).toBe(true);

    // 8. Disk Certificate & Ledger Integrity
    const certPath = path.join(projectPath, ".aegis", "production-deployment-certificate.json");
    expect(fs.existsSync(certPath)).toBe(true);
    const certOnDisk = JSON.parse(fs.readFileSync(certPath, "utf8"));
    expect(certOnDisk.status).toBe("PRODUCTION_ACCEPTED");
    expect(ProductCompletionLedger.verifyIntegrity()).toBe(true);
  });

  it("handles deployment failure, executes rollback, and verifies return to safe state", async () => {
    const projectPath = path.join(tmpBase, "gym-management-fail");
    fs.mkdirSync(projectPath, { recursive: true });

    // Trigger deployment with injected failure at MIGRATING stage
    const result = await ProductionDeploymentEngine.deploy("GymMaster Pro", projectPath, {
      simulateDeployFailureAt: "MIGRATING",
    });

    // 1. Failure detected and captured
    expect(result.lifecycle).toBe("ROLLED_BACK");
    expect(result.deployment.isFailed).toBe(true);
    expect(result.deployment.finalStage).toBe("FAILED");

    // 2. Rollback executed and verified
    expect(result.rollback).toBeDefined();
    expect(result.rollback?.isRollbackVerified).toBe(true);
    expect(result.rollback?.safeState).toBe(true);
    expect(result.rollback?.previousVersionRestored).toBe(true);
    expect(result.rollback?.healthVerified).toBe(true);
    expect(result.rollback?.smokeTestPassed).toBe(true);

    // 3. Acceptance rejected due to deployment failure
    expect(result.acceptance.isAccepted).toBe(false);
    expect(result.certificate.status).toBe("PRODUCTION_REJECTED");
  });
});
