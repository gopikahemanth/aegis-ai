/**
 * Runtime Acceptance & User Scenario E2E Tests
 * Aegis V2.3 Project 2 Phase 5.4
 */

import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { RuntimeAcceptanceRunner } from "../../testing/runtime-acceptance-runner.js";
import { FinalSuccessGate } from "../../validation/final-success-gate.js";

describe("Phase 5.4: Runtime Acceptance & Real User Scenario E2E", () => {
  const projectRoot = resolve(process.cwd(), "../../generated/project");

  it("TEST 1-5: Executes full runtime acceptance suite against running application", async () => {
    const runner = new RuntimeAcceptanceRunner(projectRoot);
    const result = await runner.execute({
      frontendPort: 5212,
      timeoutMs: 25000,
    });

    expect(result.status).toBe("SUCCESS");
    expect(result.passed).toBe(true);

    // Verify services
    expect(result.services.length).toBeGreaterThan(0);
    const feService = result.services.find((s) => s.type === "frontend");
    expect(feService).toBeDefined();
    expect(feService?.status).toBe("RUNNING");

    // Verify health
    expect(result.health.frontendHealthy).toBe(true);
    expect(result.health.backendHealthy).toBe(true);

    // Verify endpoints
    expect(result.endpoints.length).toBeGreaterThan(0);
    expect(result.endpoints.every((e) => e.status === "PASS")).toBe(true);

    // Verify user scenarios
    expect(result.userScenarios.length).toBeGreaterThan(0);
    const scenario = result.userScenarios[0];
    expect(scenario.passed).toBe(true);
    expect(scenario.stepResults.length).toBeGreaterThanOrEqual(4);
    expect(scenario.stepResults.every((s) => s.passed)).toBe(true);

    // Verify process cleanup
    expect(result.cleanupVerified).toBe(true);
  });

  it("TEST 6-7: Validates negative input handling and error rejection", async () => {
    const runner = new RuntimeAcceptanceRunner(projectRoot);
    const result = await runner.execute({
      frontendPort: 5214,
      timeoutMs: 25000,
      userScenarios: [
        {
          id: "scenario_negative_input",
          name: "Invalid Input Safety Boundary",
          description: "Verify that invalid negative values and empty fields are rejected",
          steps: [
            {
              id: "step_neg_amount",
              action: "negative_input",
              value: { amount: -100, category: "food", description: "Invalid negative expense" },
              description: "Submit negative amount",
              expectedStatus: 400,
            },
            {
              id: "step_neg_empty_cat",
              action: "negative_input",
              value: { amount: 50, category: "", description: "Missing category" },
              description: "Submit empty category",
              expectedStatus: 400,
            },
          ],
        },
      ],
    });

    expect(result.status).toBe("SUCCESS");
    const scenario = result.userScenarios.find((s) => s.scenarioId === "scenario_negative_input");
    expect(scenario).toBeDefined();
    expect(scenario?.passed).toBe(true);
    expect(result.cleanupVerified).toBe(true);
  });

  it("TEST 8: Generates deterministic runtimeHash across multiple execution passes", async () => {
    const runner = new RuntimeAcceptanceRunner(projectRoot);
    const resA = await runner.execute({ frontendPort: 5216, timeoutMs: 25000 });
    const resB = await runner.execute({ frontendPort: 5218, timeoutMs: 25000 });

    expect(resA.runtimeHash).toBeDefined();
    expect(resA.runtimeHash.length).toBe(64);
    expect(resA.runtimeHash).toBe(resB.runtimeHash);
    expect(resA.qualityChecks.length).toBe(resB.qualityChecks.length);
  });

  it("TEST 9: FinalSuccessGate incorporates runtime acceptance into authoritative gate", async () => {
    const runner = new RuntimeAcceptanceRunner(projectRoot);
    const runtimeResult = await runner.execute({ frontendPort: 5220, timeoutMs: 25000 });

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
        totalTests: 5,
        passedTests: 5,
        failedTests: 0,
        skippedTests: 0,
        durationMs: 4000,
        failedTestNames: [],
        output: "5 passed",
      },
      runtimeReport: runtimeResult,
    });

    expect(gateResult.status).toBe("SUCCESS");
    expect(gateResult.success).toBe(true);
    expect(gateResult.runtimeStatus).toBe("VERIFIED");
  });
});
