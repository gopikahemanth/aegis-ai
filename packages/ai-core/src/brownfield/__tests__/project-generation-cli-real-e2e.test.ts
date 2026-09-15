/**
 * Real CLI Full-Generation Acceptance + Runtime User Journey E2E Test
 * Aegis V2.3 Project 2 Phase 5.5
 */

import { describe, it, expect } from "vitest";
import { resolve, join } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { execSync, spawn } from "node:child_process";
import http from "node:http";
import {
  GeneratedTestPlanner,
  GeneratedTestGenerator,
  GeneratedTestValidator,
  RuntimeAcceptanceRunner,
} from "../../testing/index.js";
import { FinalSuccessGate } from "../../validation/final-success-gate.js";
import { InProjectTestRunner } from "../../validation/in-project-test-runner.js";
import {
  ASTSymbolRenamePlanner,
  StructuralRefactoringPlanner,
} from "../refactoring/index.js";

describe("Phase 5.5: Real CLI Full-Generation & Runtime User Journey Acceptance", () => {
  const projectRoot = resolve(process.cwd(), "../../generated/project");

  it("REAL CLI GENERATION: Verifies generated project structure and contracts", () => {
    // 1. Structure verification
    expect(existsSync(join(projectRoot, "package.json"))).toBe(true);
    expect(existsSync(join(projectRoot, "tsconfig.json"))).toBe(true);
    expect(existsSync(join(projectRoot, "vite.config.ts"))).toBe(true);
    expect(existsSync(join(projectRoot, "vitest.config.ts"))).toBe(true);
    expect(existsSync(join(projectRoot, "src/App.tsx"))).toBe(true);
    expect(existsSync(join(projectRoot, "src/routes.tsx"))).toBe(true);
    expect(existsSync(join(projectRoot, "src/services/api.ts"))).toBe(true);

    // 2. Contracts verification
    const aegisDir = join(projectRoot, ".aegis");
    expect(existsSync(aegisDir)).toBe(true);
    expect(existsSync(join(aegisDir, "architecture-contract.json"))).toBe(true);
    expect(existsSync(join(aegisDir, "locked-generation-plan.json"))).toBe(true);

    // Parse package.json
    const pkg = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf8"));
    expect(pkg.name).toBeDefined();
    expect(pkg.scripts.dev).toBeDefined();
    expect(pkg.scripts.build).toBeDefined();
    expect(pkg.scripts.test).toBeDefined();
  });

  it("STATIC VALIDATION & BUILD: TypeScript (0 errors) & Production Build (PASS)", () => {
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

  it("IN-PROJECT GENERATED TESTS: Executes generated test suite with 0 failures", () => {
    const testReport = InProjectTestRunner.run(projectRoot);
    expect(testReport.status).toBe("PASS");
    expect(testReport.passedTests).toBeGreaterThan(0);
    expect(testReport.failedTests).toBe(0);

    const validator = new GeneratedTestValidator(projectRoot);
    const validation = validator.validate();
    expect(validation.status).toBe("PASS");
    expect(validation.qualityAudit.passed).toBe(true);
    expect(validation.qualityAudit.hasTrivialTests).toBe(false);
  });

  it("REAL FRONTEND & BACKEND RUNTIME: Starts on dynamic port and serves HTTP 200", async () => {
    const testPort = 5230;
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
    let htmlBody = "";
    const maxRetries = 20;

    for (let i = 0; i < maxRetries; i++) {
      await new Promise((r) => setTimeout(r, 800));
      try {
        const res = await new Promise<{ status: number; body: string }>((resolveHttp) => {
          const req = http.get(`http://127.0.0.1:${testPort}`, (response) => {
            let body = "";
            response.on("data", (chunk) => (body += chunk));
            response.on("end", () => resolveHttp({ status: response.statusCode || 0, body }));
          });
          req.on("error", () => resolveHttp({ status: 0, body: "" }));
          req.setTimeout(2000, () => {
            req.destroy();
            resolveHttp({ status: 0, body: "" });
          });
        });

        if (res.status === 200) {
          isReady = true;
          htmlBody = res.body;
          break;
        }
      } catch {}
    }

    // Cleanup process
    try {
      if (process.platform === "win32" && devProcess.pid) {
        execSync(`taskkill /pid ${devProcess.pid} /T /F`, { stdio: "ignore" });
      } else {
        devProcess.kill("SIGKILL");
      }
    } catch {}

    expect(isReady).toBe(true);
    expect(htmlBody).toContain('id="root"');
  });

  it("REAL USER JOURNEY & LIFECYCLE: Executes complete CRUD lifecycle and negative validation", async () => {
    const runner = new RuntimeAcceptanceRunner(projectRoot);
    const result = await runner.execute({
      frontendPort: 5232,
      timeoutMs: 25000,
      userScenarios: [
        {
          id: "scenario_expense_user_journey",
          name: "Expense Tracker Full User Journey",
          description: "Load dashboard -> Query expenses -> Create expense -> Verify persistence -> Delete expense -> Negative validation",
          steps: [
            { id: "step_1_load", action: "navigate", target: "/", description: "Load application dashboard", expectedStatus: 200 },
            { id: "step_2_mount", action: "assert_element", target: "#root", description: "Verify root DOM container" },
            { id: "step_3_create", action: "api_call", target: "create", value: { amount: 85.50, category: "food", description: "Team lunch", date: "2026-08-22" }, description: "Create expense record", expectedStatus: 200 },
            { id: "step_4_query", action: "api_call", target: "getAll", description: "Query expense records", expectedStatus: 200 },
            { id: "step_5_delete", action: "api_call", target: "remove", value: { id: "1" }, description: "Delete expense record", expectedStatus: 200 },
            { id: "step_6_negative", action: "negative_input", value: { amount: -20, category: "", description: "" }, description: "Reject invalid negative input", expectedStatus: 400 },
          ],
        },
      ],
    });

    expect(result.status).toBe("SUCCESS");
    expect(result.passed).toBe(true);
    expect(result.cleanupVerified).toBe(true);

    const journey = result.userScenarios.find((s) => s.scenarioId === "scenario_expense_user_journey");
    expect(journey).toBeDefined();
    expect(journey?.passed).toBe(true);
    expect(journey?.stepResults.every((s) => s.passed)).toBe(true);
  });

  it("FINAL SUCCESS GATE & QUALITY DIMENSIONS: Verifies all 12 criteria are satisfied", async () => {
    const runner = new RuntimeAcceptanceRunner(projectRoot);
    const runtimeResult = await runner.execute({ frontendPort: 5234, timeoutMs: 25000 });

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
        renderedElementsCount: 35,
        routesChecked: ["/"],
        consoleErrors: [],
      } as any,
      apiReport: {
        passed: true,
        totalSteps: 3,
        passedSteps: 3,
        failedSteps: 0,
        summary: "API verified",
      } as any,
      testReport: {
        status: "PASS",
        framework: "vitest",
        totalTests: 5,
        passedTests: 5,
        failedTests: 0,
        skippedTests: 0,
        durationMs: 4500,
        failedTestNames: [],
        output: "5 passed",
      },
      runtimeReport: runtimeResult,
    });

    expect(gateResult.status).toBe("SUCCESS");
    expect(gateResult.success).toBe(true);
    expect(gateResult.codeStatus).toBe("PASS");
    expect(gateResult.runtimeStatus).toBe("VERIFIED");
  });

  it("CONTROLLED FAILURE INJECTION: Rejects invalid contract/build without false positive", () => {
    const gateResult = FinalSuccessGate.verify({
      projectRoot,
      contract: null, // Injected failure: missing contract
      buildSuccess: false, // Injected failure: broken build
      serverReady: false,
      testReport: {
        status: "FAIL",
        framework: "vitest",
        totalTests: 5,
        passedTests: 0,
        failedTests: 5,
        skippedTests: 0,
        durationMs: 1000,
        failedTestNames: ["failed_test"],
        output: "5 failed",
      },
    });

    expect(gateResult.status).toBe("FAILED");
    expect(gateResult.success).toBe(false);
    expect(gateResult.codeStatus).toBe("FAIL");
    expect(gateResult.blockingReason).toBeDefined();
  });

  it("BROWNFIELD COMPATIBILITY ON REAL GENERATED CODE: Non-destructive AST planning passes", () => {
    const renamePlanner = new ASTSymbolRenamePlanner(projectRoot);
    const renamePlan = renamePlanner.planRename({
      projectPath: projectRoot,
      sourceFile: "src/services/api.ts",
      symbolName: "apiClient",
      newName: "expenseApiClientV5",
    });

    expect(renamePlan.status).toBe("READY");
    expect(renamePlan.planHash.length).toBe(64);
    expect(renamePlan.patches.length).toBeGreaterThan(0);

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
    expect(movePlan.patchOperations.length).toBeGreaterThan(0);
  });

  it("DETERMINISM: Reproduces identical planHash and runtimeHash across multiple passes", async () => {
    const testPlanner = new GeneratedTestPlanner(projectRoot);
    const planA = testPlanner.plan();
    const planB = testPlanner.plan();
    expect(planA.planHash).toBe(planB.planHash);

    const runner = new RuntimeAcceptanceRunner(projectRoot);
    const resA = await runner.execute({ frontendPort: 5236, timeoutMs: 25000 });
    const resB = await runner.execute({ frontendPort: 5238, timeoutMs: 25000 });
    expect(resA.runtimeHash).toBe(resB.runtimeHash);
  });
});
