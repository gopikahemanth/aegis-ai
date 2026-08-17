import { describe, it, expect, beforeEach } from "vitest";
import { RequirementInterpreter } from "../requirement-interpreter.js";
import { ProductArchitecturePlanner } from "../architecture-planner.js";
import { GenerationOrchestrator } from "../generation-orchestrator.js";
import { BuildExecutionEngine } from "../build-execution-engine.js";
import { RuntimeLaunchEngine } from "../runtime-launch-engine.js";
import { DefectDiagnosisEngine } from "../defect-diagnosis-engine.js";
import { RepairPlanner } from "../repair-planner.js";
import { AutonomousVerificationLoop } from "../autonomous-verification-loop.js";
import { ProductDeliveryEngine } from "../product-delivery-engine.js";
import { ProductBuildOrchestrator } from "../product-build-orchestrator.js";
import { ProductBuilder } from "../product-builder-api.js";
import { RequirementContractRegistry } from "../../product-completion/requirement-contract-registry.js";
import { ProductCompletionLedger } from "../../product-completion/product-completion-ledger.js";

describe("AEGIS Phase 46 — Master Autonomous Full-Stack Product Builder Integration E2E Test", () => {
  beforeEach(() => {
    RequirementContractRegistry.reset();
    ProductCompletionLedger.reset();
    RuntimeLaunchEngine.stopAllProcesses();
  });

  it("takes natural language user prompt through complete autonomous lifecycle: Requirement -> Architecture -> Generation -> Build -> Runtime -> Verification -> Repair -> Acceptance", async () => {
    const userPrompt =
      "Build me a complete gym management website with authentication, dashboard, members, trainers, payments, attendance and admin panel.";

    // 1. Requirement Understanding
    const parsedReqs = RequirementInterpreter.interpretPrompt(userPrompt);
    expect(parsedReqs.length).toBeGreaterThanOrEqual(7);

    // 2. Architecture Planning
    const plan = ProductArchitecturePlanner.planArchitecture("GymMasterPro", userPrompt);
    expect(plan.frontend.framework).toBe("React-Vite");
    expect(plan.backend.framework).toBe("Express");
    expect(plan.database.models).toContain("Member");
    expect(plan.database.models).toContain("Trainer");

    // 3. Project Generation
    const payload = GenerationOrchestrator.generateFullStackProject(plan, "./dist/gym-master");
    expect(payload.totalFiles).toBeGreaterThanOrEqual(5);

    // 4. Build Execution
    const buildReport = BuildExecutionEngine.executeBuildPipeline();
    expect(buildReport.status).toBe("BUILD_PASSED");

    // 5. Runtime Launch
    const runtimeReport = RuntimeLaunchEngine.launchApplication(5173, 3001, true);
    expect(runtimeReport.isAvailable).toBe(true);

    // 6. Autonomous Verification Loop with simulated defect injection and repair
    const loopResult = AutonomousVerificationLoop.executeLoop(
      {
        errorText: "TypeError: Cannot read properties of undefined (reading 'memberId')",
        affectedFile: "server/controllers/member.controller.ts",
      },
      {
        maxRepairAttempts: 3,
        maxBuildAttempts: 3,
        maxVerificationCycles: 3,
      }
    );
    expect(loopResult.isAccepted).toBe(true);
    expect(loopResult.totalRepairsApplied).toBe(1);

    // 7. High-level ProductBuilder API Execution
    const orchestrator = new ProductBuildOrchestrator();
    const finalDelivery = await orchestrator.executeAutonomousBuild(
      userPrompt,
      "GymMasterPro",
      "./dist/gym-master"
    );

    expect(finalDelivery.status).toBe("ACCEPTED");
    expect(finalDelivery.projectName).toBe("GymMasterPro");
    expect(finalDelivery.requirementsSummary.verifiedCount).toBe(parsedReqs.length);
    expect(finalDelivery.buildStatus).toBe("BUILD_PASSED");
    expect(finalDelivery.runtimeStatus).toBe("HEALTHY");
    expect(finalDelivery.browserWorkflowsPassed).toBe(true);
    expect(finalDelivery.productCompletionCertificate.tier).toBe(34);
    expect(finalDelivery.productCompletionCertificate.status).toBe("PRODUCT_COMPLETION_CERTIFIED");

    // Check orchestrator state history
    const history = orchestrator.getHistory();
    expect(history.map((h) => h.state)).toContain("RECEIVED");
    expect(history.map((h) => h.state)).toContain("ANALYZING");
    expect(history.map((h) => h.state)).toContain("PLANNING");
    expect(history.map((h) => h.state)).toContain("GENERATING");
    expect(history.map((h) => h.state)).toContain("BUILDING");
    expect(history.map((h) => h.state)).toContain("VERIFYING");
    expect(history.map((h) => h.state)).toContain("ACCEPTED");

    // Verify ledger integrity
    expect(ProductCompletionLedger.verifyIntegrity()).toBe(true);
  });
});
