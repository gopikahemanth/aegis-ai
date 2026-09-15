/**
 * Autonomous Self-Healing & Wiring Integrity E2E Tests
 * Aegis V2.3 Project 2 Phase 5.6
 */

import { describe, it, expect } from "vitest";
import { resolve, join } from "node:path";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { WiringIntegrityChecker } from "../../validation/wiring-integrity-checker.js";
import { SelfHealingCoordinator } from "../../healing/self-healing-coordinator.js";

describe("Phase 5.6: Autonomous Self-Healing & Wiring Integrity", () => {
  const projectRoot = resolve(process.cwd(), "../../generated/project");

  it("TEST 1: Wiring Integrity Checker verifies genuine frontend <-> API integration without stubs", () => {
    const checker = new WiringIntegrityChecker(projectRoot);
    const report = checker.audit();

    expect(report.status).toBe("PASS");
    expect(report.passed).toBe(true);
    expect(report.stubViolations.length).toBe(0);
    expect(report.unwiredServices.length).toBe(0);
    expect(report.componentsCount).toBeGreaterThan(0);
  });

  it("TEST 2: Autonomously diagnoses and repairs recoverable defect with transaction checkpoint", async () => {
    const coordinator = new SelfHealingCoordinator(projectRoot);
    const defectSummary = "Error: Type 'number' is not assignable to type 'string' in src/services/api.ts";

    const report = await coordinator.diagnoseAndRepair(defectSummary, "src/services/api.ts", 3);

    expect(report.status).toBe("REPAIRED");
    expect(report.success).toBe(true);
    expect(report.totalAttempts).toBeLessThanOrEqual(3);
    expect(report.attempts[0].typecheckPassed).toBe(true);
  });

  it("TEST 3: Bounded retry safety - unrecoverable environment errors terminate safely with diagnostics", async () => {
    const coordinator = new SelfHealingCoordinator(projectRoot);
    const unrecoverableError = "ENVIRONMENT_ERROR: EACCES permission denied on socket 0.0.0.0:80";

    const report = await coordinator.diagnoseAndRepair(unrecoverableError, "src/services/api.ts", 3);

    expect(report.status).toBe("FAILED");
    expect(report.success).toBe(false);
    expect(report.finalDiagnostic).toBeDefined();
    expect(report.finalDiagnostic).toContain("ENVIRONMENT_ERROR");
  });
});
