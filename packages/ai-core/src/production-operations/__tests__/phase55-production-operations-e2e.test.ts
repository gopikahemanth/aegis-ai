import { describe, it, expect, beforeEach } from "vitest";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { ProductionOperationsEngine } from "../production-operations-engine.js";
import { ProductCompletionLedger } from "../../product-completion/product-completion-ledger.js";
import { ProductionIncidentLedger } from "../production-incident-ledger.js";

describe("AEGIS Phase 55 — Master E2E Production Operations & Self-Healing", () => {
  const tmpBase = path.join(os.tmpdir(), "aegis-p55-e2e");

  beforeEach(() => {
    ProductCompletionLedger.reset();
    ProductionIncidentLedger.reset();
    if (fs.existsSync(tmpBase)) {
      fs.rmSync(tmpBase, { recursive: true, force: true });
    }
    fs.mkdirSync(tmpBase, { recursive: true });
  });

  it("handles realistic production failure with automated diagnosis, safe self-healing, and verified recovery", async () => {
    const projectPath = path.join(tmpBase, "gym-ops-prod");
    fs.mkdirSync(projectPath, { recursive: true });

    // Execute Master Production Operations Engine with injected database load incident
    const result = await ProductionOperationsEngine.executeOperationalCycle("GymMaster Pro", {
      projectPath,
      domain: "aegisgym.com",
      simulateIncident: "DATABASE_LOAD",
    });

    // 1. Lifecycle verification
    expect(result.lifecycle).toBe("RECOVERED");
    expect(result.monitoredDomain).toBe("aegisgym.com");

    // 2. Anomaly & Incident Detection
    expect(result.anomalies.hasAnomalies).toBe(true);
    expect(result.incident).not.toBeNull();
    expect(result.incident?.severity).toBe("SEV1_CRITICAL");

    // 3. Root Cause Diagnosis
    expect(result.diagnosis).toBeDefined();
    expect(result.diagnosis?.certainty).toBe("CONFIRMED");
    expect(result.diagnosis?.rootCause).toContain("Database connection pool");

    // 4. Safe Remediation & Self-Healing
    expect(result.remediationPlan?.primaryAction.type).toBe("RESTART_DATABASE_POOL");
    expect(result.healingResult?.isResolved).toBe(true);
    expect(result.healingResult?.requiresHumanIntervention).toBe(false);

    // 5. Recovery Verification
    expect(result.healingResult?.history[0].recoveryReport?.isRecovered).toBe(true);
    expect(result.healingResult?.history[0].recoveryReport?.businessWorkflowPassed).toBe(true);

    // 6. Incident Ledger & Cryptographic Chain
    expect(ProductionIncidentLedger.getEntries().length).toBeGreaterThanOrEqual(4);
    expect(ProductionIncidentLedger.verifyIntegrity()).toBe(true);

    // 7. Operations Acceptance & Tier 42 Certificate
    expect(result.acceptance.isAccepted).toBe(true);
    expect(result.acceptance.criticalDefectCount).toBe(0);
    expect(result.certificate.tier).toBe(42);
    expect(result.certificate.status).toBe("OPERATIONS_ACCEPTED");

    // 8. Disk Certificate & Ledger
    const certPath = path.join(projectPath, ".aegis", "production-operations-certificate.json");
    expect(fs.existsSync(certPath)).toBe(true);
    const certOnDisk = JSON.parse(fs.readFileSync(certPath, "utf8"));
    expect(certOnDisk.status).toBe("OPERATIONS_ACCEPTED");
    expect(ProductCompletionLedger.verifyIntegrity()).toBe(true);
  });

  it("blocks unapproved high-risk remediation and escalates to human intervention", async () => {
    const projectPath = path.join(tmpBase, "gym-ops-auth");
    fs.mkdirSync(projectPath, { recursive: true });

    // Execute with incident requiring authorization
    const result = await ProductionOperationsEngine.executeOperationalCycle("GymMaster Pro", {
      projectPath,
      domain: "aegisgym.com",
      simulateIncident: "UNAUTHORIZED_ACTION",
      isAuthorized: false,
    });

    expect(result.lifecycle).toBe("ESCALATED");
    expect(result.remediationPlan?.requiresHumanApproval).toBe(true);
    expect(result.healingResult?.isResolved).toBe(false);
    expect(result.healingResult?.requiresHumanIntervention).toBe(true);
    expect(result.healingResult?.escalationReason).toContain("requires human authorization");
    expect(result.acceptance.isAccepted).toBe(false);
    expect(result.certificate.status).toBe("OPERATIONS_REJECTED");
  });

  it("escalates when self-healing attempts are exhausted after 3 attempts", async () => {
    const projectPath = path.join(tmpBase, "gym-ops-exhausted");
    fs.mkdirSync(projectPath, { recursive: true });

    const result = await ProductionOperationsEngine.executeOperationalCycle("GymMaster Pro", {
      projectPath,
      domain: "aegisgym.com",
      simulateIncident: "EXHAUSTED_RETRIES",
    });

    expect(result.lifecycle).toBe("ESCALATED");
    expect(result.healingResult?.isResolved).toBe(false);
    expect(result.healingResult?.totalAttempts).toBe(3);
    expect(result.healingResult?.requiresHumanIntervention).toBe(true);
  });
});
