/**
 * Project Generation Tests & Runtime Acceptance E2E Test
 * Aegis V2.3 Project 2 Phase 5.3
 */

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { execSync, spawn } from "node:child_process";
import http from "node:http";
import {
  GeneratedTestPlanner,
  GeneratedTestGenerator,
  GeneratedTestValidator,
} from "../../testing/index.js";
import { FinalSuccessGate } from "../../validation/final-success-gate.js";
import {
  ASTSymbolRenamePlanner,
  RenamePreviewEngine,
  StructuralRefactoringPlanner,
  StructuralRefactoringPreviewEngine,
} from "../refactoring/index.js";

describe("Phase 5.3: Generated Application Test & Runtime Acceptance", () => {
  const projectRoot = resolve(process.cwd(), "../../generated/project");

  it("TEST GENERATION: Planner generates deterministic test specifications", () => {
    const planner = new GeneratedTestPlanner(projectRoot);
    const plan = planner.plan();

    expect(plan.planHash).toBeDefined();
    expect(plan.planHash.length).toBe(64);
    expect(plan.testCases.length).toBeGreaterThanOrEqual(4);

    const testTypes = new Set(plan.testCases.map((tc) => tc.testType));
    expect(testTypes.has("unit")).toBe(true);
    expect(testTypes.has("component")).toBe(true);
    expect(testTypes.has("service")).toBe(true);
  });

  it("TEST SYNTHESIS & ANTI-CHEATING: Synthesizes genuine non-trivial test suites", () => {
    const generator = new GeneratedTestGenerator(projectRoot);
    const manifest = generator.generate();

    expect(manifest.status).toBe("PASS");
    expect(manifest.framework).toBe("vitest");
    expect(manifest.generatedFiles.length).toBeGreaterThanOrEqual(4);

    // Anti-cheating quality audit
    expect(manifest.qualityReport.hasTrivialTests).toBe(false);
    expect(manifest.qualityReport.trivialViolations.length).toBe(0);
    expect(manifest.qualityReport.realAssertionCount).toBeGreaterThan(15);
    expect(manifest.qualityReport.passed).toBe(true);
  });

  it("TEST EXECUTION: Generated test suite passes all tests with 0 failures and 0 skips", () => {
    const validator = new GeneratedTestValidator(projectRoot);
    const report = validator.validate();

    expect(report.status).toBe("PASS");
    expect(report.totalTestFiles).toBeGreaterThanOrEqual(4);
    expect(report.totalTests).toBeGreaterThan(0);
    expect(report.passedTests).toBeGreaterThan(0);
    expect(report.failedTests).toBe(0);
    expect(report.skippedTests).toBe(0);
    expect(report.qualityAudit.passed).toBe(true);
  });

  it("STATIC VALIDATION: TypeScript check (0 errors) and Vite production build (PASS)", () => {
    // 1. TypeScript compiler check
    let tsError = false;
    try {
      execSync("npx --yes tsc --noEmit", { cwd: projectRoot, stdio: "pipe" });
    } catch {
      tsError = true;
    }
    expect(tsError).toBe(false);

    // 2. Vite production build
    let buildError = false;
    try {
      execSync("npx --yes vite build", { cwd: projectRoot, stdio: "pipe" });
    } catch {
      buildError = true;
    }
    expect(buildError).toBe(false);
  });

  it("RUNTIME VALIDATION: Application dev server responds with HTTP 200", async () => {
    const testPort = 5198;
    const devProcess = spawn(
      "npx",
      ["--yes", "vite", "--port", String(testPort), "--host", "127.0.0.1"],
      {
        cwd: projectRoot,
        stdio: "pipe",
        shell: true,
      }
    );

    let isReady = false;
    const maxRetries = 20;

    for (let i = 0; i < maxRetries; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const res = await new Promise<number>((resolveHttp) => {
          const req = http.get(`http://127.0.0.1:${testPort}`, (response) => {
            resolveHttp(response.statusCode || 0);
          });
          req.on("error", () => resolveHttp(0));
          req.setTimeout(2000, () => {
            req.destroy();
            resolveHttp(0);
          });
        });

        if (res === 200) {
          isReady = true;
          break;
        }
      } catch {}
    }

    // Kill dev process
    try {
      if (process.platform === "win32" && devProcess.pid) {
        execSync(`taskkill /pid ${devProcess.pid} /T /F`, { stdio: "ignore" });
      } else {
        devProcess.kill("SIGKILL");
      }
    } catch {}

    expect(isReady).toBe(true);
  });

  it("FINAL SUCCESS GATE: Verifies complete greenfield acceptance gate with test pass", () => {
    const validator = new GeneratedTestValidator(projectRoot);
    const testValidation = validator.validate();

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
        summary: "All 2 API workflows executed and verified cleanly.",
      } as any,
      testReport: {
        status: testValidation.status,
        framework: testValidation.framework,
        totalTests: testValidation.totalTests,
        passedTests: testValidation.passedTests,
        failedTests: testValidation.failedTests,
        skippedTests: testValidation.skippedTests,
        durationMs: testValidation.durationMs,
        failedTestNames: testValidation.failedTestNames,
        output: testValidation.output,
      },
    });

    expect(gateResult.status).toBe("SUCCESS");
    expect(gateResult.success).toBe(true);
    expect(gateResult.codeStatus).toBe("PASS");
  });

  it("BROWNFIELD COMPATIBILITY: Non-destructive AST refactoring planning on generated code", () => {
    const renamePlanner = new ASTSymbolRenamePlanner(projectRoot);
    const renamePlan = renamePlanner.planRename({
      projectPath: projectRoot,
      sourceFile: "src/services/api.ts",
      symbolName: "apiClient",
      newName: "expenseApiClientV3",
    });

    expect(renamePlan.status).toBe("READY");
    expect(renamePlan.planHash.length).toBe(64);

    const movePlanner = new StructuralRefactoringPlanner(projectRoot);
    const movePlan = movePlanner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: projectRoot,
      sourceFile: "src/services/studentService.ts",
      symbolName: "studentService",
      destinationFile: "src/utils/student-utils.ts",
    });

    expect(movePlan.impactStatus).toBe("READY");
    expect(movePlan.planHash.length).toBe(64);
  });

  it("DETERMINISM: Generates equivalent deterministic hashes across multiple plan passes", () => {
    const planner = new GeneratedTestPlanner(projectRoot);
    const planA = planner.plan();
    const planB = planner.plan();

    expect(planA.planHash).toBe(planB.planHash);
    expect(planA.testCases.length).toBe(planB.testCases.length);
  });
});
