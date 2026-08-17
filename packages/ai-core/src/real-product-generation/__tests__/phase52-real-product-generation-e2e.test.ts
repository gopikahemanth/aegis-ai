import { describe, it, expect, beforeEach } from "vitest";
import { RealProductGenerationEngine } from "../real-product-generation-engine.js";
import { ProductCompletionLedger } from "../../product-completion/product-completion-ledger.js";
import * as os from "os";
import * as path from "path";

describe("AEGIS Phase 52 — Master Real Product Generation E2E Test", () => {
  beforeEach(() => {
    ProductCompletionLedger.reset();
  });

  it(`proves the complete Phase 52 cycle:
    GENERATE → REAL FAILURE (injected defect) → DETECT → DIAGNOSE → REPAIR → REBUILD → REAL WORKFLOW → PASS → ACCEPT`, async () => {

    const requirement = `
      Build a complete gym management SaaS with admin/staff authentication,
      member management, trainers, memberships, attendance, payments, reports,
      notifications, analytics, role-based permissions and a professional responsive UI.
    `;

    const outputDir = path.join(os.tmpdir(), "aegis-phase52-e2e");

    const result = await RealProductGenerationEngine.generate(
      requirement,
      "AegisGymPro",
      outputDir,
      // Inject a realistic defect: attendance check-in API fails to respond
      { workflowId: "wf_gym_record_attendance", description: "POST /api/attendance returned 500 — attendance service not initialized" }
    );

    // 1. Project physically created on disk
    expect(result.provisioning.isProvisioned).toBe(true);
    expect(result.provisioning.directoryCreated).toBe(true);

    // 2. Database fully provisioned with real persistence verification
    expect(result.database.isFullyVerified).toBe(true);
    expect(result.database.state).toBe("PERSISTENCE_VERIFIED");

    // 3. Backend and Frontend both operational
    expect(result.backend.isFullyVerified).toBe(true);
    expect(result.frontend.isFullyVerified).toBe(true);

    // 4. Application fully launched
    expect(result.launch.state).toBe("FULLY_RUNNING");
    expect(result.launch.backendHealthy).toBe(true);
    expect(result.launch.frontendHealthy).toBe(true);

    // 5. Initial workflow execution detected the injected defect
    const failedWf = result.workflows.executions.find((e) => e.workflowId === "wf_gym_record_attendance");
    expect(failedWf?.isPassed).toBe(false);
    expect(result.workflows.failedWorkflows).toBeGreaterThan(0);

    // 6. Repair loop autonomously resolved the defect
    expect(result.repairLoop).toBeDefined();
    expect(result.repairLoop?.outcome).toBe("RESOLVED");
    expect(result.repairLoop?.humanInterventionRequired).toBe(false);

    // 7. Final 12-point acceptance evaluation ACCEPTED
    expect(result.productAcceptance.isAccepted).toBe(true);
    expect(result.productAcceptance.criticalDefectCount).toBe(0);
    expect(result.productAcceptance.overallScore).toBe(100);

    // 8. Delivery manifest with real evidence
    expect(result.deliveryManifest.status).toBe("ACCEPTED");
    expect(result.deliveryManifest.buildVerified).toBe(true);
    expect(result.deliveryManifest.databaseVerified).toBe(true);
    expect(result.deliveryManifest.configurationRequired.length).toBeGreaterThan(0);

    // 9. Tier 39 Governance Certificate issued with real evidence
    expect(result.certificate.gate).toBe("RealProductGenerationGate");
    expect(result.certificate.tier).toBe(39);
    expect(result.certificate.status).toBe("ACCEPTED");
    expect(result.certificate.evidence.workflowsExecuted).toBeGreaterThan(0);
    expect(result.certificate.evidence.criticalDefects).toBe(0);

    // 10. Final lifecycle stage is DELIVERED
    expect(result.lifecycle).toBe("DELIVERED");

    // 11. Cryptographic ledger integrity preserved
    expect(ProductCompletionLedger.verifyIntegrity()).toBe(true);
  }, 30000);
});
