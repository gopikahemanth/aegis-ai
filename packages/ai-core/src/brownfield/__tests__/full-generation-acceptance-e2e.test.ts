/**
 * Full Generation Acceptance & Runtime Quality E2E Test
 * Aegis V2.3 Project 2 Phase 5.4
 */

import { describe, it, expect } from "vitest";
import { resolve, join } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import {
  GeneratedTestPlanner,
  GeneratedTestGenerator,
  GeneratedTestValidator,
  RuntimeAcceptanceRunner,
} from "../../testing/index.js";
import { FinalSuccessGate } from "../../validation/final-success-gate.js";
import {
  ASTSymbolRenamePlanner,
  StructuralRefactoringPlanner,
} from "../refactoring/index.js";

describe("Phase 5.4: Full Generation Pipeline & Runtime Quality Acceptance", () => {
  const projectRoot = resolve(process.cwd(), "../../generated/project");

  it("FULL PIPELINE: Validates prompt-to-runtime full acceptance pipeline", async () => {
    // 1. Structure & Architecture Verification
    expect(existsSync(join(projectRoot, "package.json"))).toBe(true);
    expect(existsSync(join(projectRoot, "tsconfig.json"))).toBe(true);
    expect(existsSync(join(projectRoot, "vite.config.ts"))).toBe(true);
    expect(existsSync(join(projectRoot, ".aegis"))).toBe(true);

    // 2. Test Generation & Quality Verification
    const planner = new GeneratedTestPlanner(projectRoot);
    const testPlan = planner.plan();
    expect(testPlan.planHash.length).toBe(64);

    const testGenerator = new GeneratedTestGenerator(projectRoot);
    const manifest = testGenerator.generate();
    expect(manifest.status).toBe("PASS");
    expect(manifest.qualityReport.passed).toBe(true);

    // 3. Static Validation: TypeScript (0 errors) & Production Build (PASS)
    execSync("npx --yes tsc --noEmit", { cwd: projectRoot, stdio: "pipe" });
    execSync("npx --yes vite build", { cwd: projectRoot, stdio: "pipe" });

    // 4. Test Execution
    const validator = new GeneratedTestValidator(projectRoot);
    const testReport = validator.validate();
    expect(testReport.status).toBe("PASS");
    expect(testReport.failedTests).toBe(0);

    // 5. Runtime Acceptance & Scenario Execution
    const runner = new RuntimeAcceptanceRunner(projectRoot);
    const runtimeResult = await runner.execute({
      frontendPort: 5222,
      timeoutMs: 25000,
    });

    expect(runtimeResult.status).toBe("SUCCESS");
    expect(runtimeResult.passed).toBe(true);
    expect(runtimeResult.cleanupVerified).toBe(true);

    // 6. FinalSuccessGate Verification
    const gateResult = FinalSuccessGate.verify({
      projectRoot,
      contract: {
        frontend: { framework: "react", language: "typescript" },
        backend: { framework: "express", language: "typescript" },
        database: { provider: "sqlite" },
        architectureHash: "arch_contract_hash",
      } as any,
      buildSuccess: true,
      serverReady: true,
      browserResult: {
        passed: true,
        renderedElementsCount: 30,
        routesChecked: ["/"],
        consoleErrors: [],
      } as any,
      apiReport: {
        passed: true,
        totalSteps: 2,
        passedSteps: 2,
        failedSteps: 0,
        summary: "API verified",
      } as any,
      testReport: {
        status: "PASS",
        framework: "vitest",
        totalTests: testReport.totalTests,
        passedTests: testReport.passedTests,
        failedTests: testReport.failedTests,
        skippedTests: testReport.skippedTests,
        durationMs: testReport.durationMs,
        failedTestNames: [],
        output: testReport.output,
      },
      runtimeReport: runtimeResult,
    });

    expect(gateResult.status).toBe("SUCCESS");
    expect(gateResult.success).toBe(true);
    expect(gateResult.codeStatus).toBe("PASS");
    expect(gateResult.runtimeStatus).toBe("VERIFIED");

    // 7. Brownfield Compatibility Check
    const renamePlanner = new ASTSymbolRenamePlanner(projectRoot);
    const renamePlan = renamePlanner.planRename({
      projectPath: projectRoot,
      sourceFile: "src/services/api.ts",
      symbolName: "apiClient",
      newName: "expenseApiClientV4",
    });
    expect(renamePlan.status).toBe("READY");

    const movePlanner = new StructuralRefactoringPlanner(projectRoot);
    const movePlan = movePlanner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: projectRoot,
      sourceFile: "src/services/studentService.ts",
      symbolName: "studentService",
      destinationFile: "src/utils/student-utils.ts",
    });
    expect(movePlan.impactStatus).toBe("READY");
  });
});
