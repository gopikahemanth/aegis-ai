/**
 * final-success-gate.test.ts
 *
 * Tests that FinalSuccessGate requires actual evidence across all mandatory gates
 * and returns explicit statuses (SUCCESS, FAILED, BLOCKED, INCOMPLETE).
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { FinalSuccessGate } from "../final-success-gate.js";
import { DomainContractManager } from "../../governance/domain-contract.js";
import type { ArchitectureContractV1 } from "../../governance/architecture-resolver.js";

const TEST_DIR = join(process.cwd(), ".tmp_test_final_gate");

function makeContract(): ArchitectureContractV1 {
  return {
    version: 1,
    frontend: { framework: "React-Vite", provenance: "explicit" },
    backend: { framework: "Express", provenance: "explicit" },
    database: { provider: "PostgreSQL", orm: "Prisma", provenance: "explicit", ormProvenance: "explicit" },
    language: "TypeScript",
    styling: "TailwindCSS",
    authentication: "JWT",
    packageManager: "pnpm",
    requiredModels: ["User", "Scan"],
    requiredFeatures: ["Security Scan"],
    requiredLibraries: [],
    requiredRoutes: ["/"],
  };
}

describe("FinalSuccessGate — Evidence-Based Acceptance", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(join(TEST_DIR, "prisma"), { recursive: true });
    mkdirSync(join(TEST_DIR, "src"), { recursive: true });
    mkdirSync(join(TEST_DIR, ".aegis"), { recursive: true });

    // Setup domain contract
    DomainContractManager.lock(makeContract(), "test_arch_hash", TEST_DIR);

    // Setup basic valid files
    writeFileSync(join(TEST_DIR, "prisma", "schema.prisma"), "model User { id String @id }\nmodel Scan { id String @id }");
    writeFileSync(join(TEST_DIR, "src", "App.tsx"), "export const App = () => <div>App</div>;");
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("returns SUCCESS when all mandatory acceptance gates pass with evidence", () => {
    const res = FinalSuccessGate.verify({
      projectRoot: TEST_DIR,
      contract: makeContract(),
      buildSuccess: true,
      serverReady: true,
      browserResult: {
        passed: true,
        url: "http://localhost:5173",
        routesChecked: ["/", "/upload"],
        consoleErrors: [],
        uncaughtExceptions: [],
        failedNetworkRequests: [],
        renderedElementsCount: 25,
      },
      apiReport: {
        passed: true,
        totalSteps: 2,
        passedSteps: 2,
        failedSteps: 0,
        results: [],
        summary: "2/2 API tests passed",
      },
      realityResult: {
        passed: true,
        violationCount: 0,
        report: "Clean",
        violations: [],
      },
      databaseBlocked: false,
    });

    expect(res.status).toBe("SUCCESS");
    expect(res.success).toBe(true);
    expect(res.codeStatus).toBe("PASS");
    expect(res.runtimeStatus).toBe("VERIFIED");
  });

  it("returns FAILED when build fails", () => {
    const res = FinalSuccessGate.verify({
      projectRoot: TEST_DIR,
      contract: makeContract(),
      buildSuccess: false,
      buildDiagnostics: "error TS2322: Type mismatch",
      serverReady: false,
      browserResult: null,
    });

    expect(res.status).toBe("FAILED");
    expect(res.success).toBe(false);
    expect(res.blockingReason).toContain("Build / Compilation");
  });

  it("returns BLOCKED when database is blocked but code is fine", () => {
    const res = FinalSuccessGate.verify({
      projectRoot: TEST_DIR,
      contract: makeContract(),
      buildSuccess: true,
      serverReady: false,
      browserResult: null,
      databaseBlocked: true,
    });

    expect(res.status).toBe("BLOCKED");
    expect(res.databaseStatus).toBe("BLOCKED");
    expect(res.success).toBe(false);
  });

  describe("FinalSuccessGate — Brownfield Success Authority", () => {
    it("returns SUCCESS in BROWNFIELD mode with real structured reports and zero greenfield artifacts", () => {
      const res = FinalSuccessGate.verify({
        projectRoot: TEST_DIR,
        mode: "BROWNFIELD",
        contract: null, // No greenfield architecture contract
        buildSuccess: true,
        serverReady: true,
        brownfieldReport: {
          baselineReport: { status: "PASS", passedTests: 4, totalTests: 4 },
          impactReport: { status: "CLOSED", mustChange: ["prisma/schema.prisma", "server/services/taskService.ts"] },
          patchReport: { status: "CLOSED_AND_CONVERGENT", touchedFiles: ["prisma/schema.prisma", "server/services/taskService.ts"] },
          gitReport: { allowed: true, status: "CLEAN" },
          buildReport: { status: "PASS" },
          testReport: { status: "PASS", passedTests: 6, totalTests: 6 },
          runtimeReport: { verified: true, endpointsTested: ["POST /api/tasks", "GET /api/tasks"] },
          realityReport: { passed: true, score: 100, violations: [] },
          domainReport: { clean: true, violations: [] },
          transactionReport: { status: "COMMITTED" },
        },
      });

      expect(res.status).toBe("SUCCESS");
      expect(res.success).toBe(true);
      expect(res.codeStatus).toBe("PASS");
      expect(res.runtimeStatus).toBe("VERIFIED");
      expect(res.items.length).toBe(10);
      expect(res.items.every(i => i.passed)).toBe(true);
    });

    it("returns BLOCKED in BROWNFIELD mode when git dirty target conflict is detected", () => {
      const res = FinalSuccessGate.verify({
        projectRoot: TEST_DIR,
        mode: "BROWNFIELD",
        contract: null,
        buildSuccess: true,
        brownfieldReport: {
          gitReport: { allowed: false, status: "GIT_DIRTY_TARGET", reason: "Uncommitted edits in target file" },
        },
      });

      expect(res.status).toBe("BLOCKED");
      expect(res.success).toBe(false);
      expect(res.blockingReason).toContain("Uncommitted edits in target file");
    });

    it("returns BLOCKED in BROWNFIELD mode when destructive schema migration is blocked", () => {
      const res = FinalSuccessGate.verify({
        projectRoot: TEST_DIR,
        mode: "BROWNFIELD",
        contract: null,
        buildSuccess: true,
        brownfieldReport: {
          impactReport: { status: "DESTRUCTIVE_SCHEMA_MIGRATION_BLOCKED" },
        },
      });

      expect(res.status).toBe("BLOCKED");
      expect(res.success).toBe(false);
      expect(res.blockingReason).toContain("Destructive schema migration");
    });

    it("returns BLOCKED in BROWNFIELD mode when dynamic API URL halts impact analysis", () => {
      const res = FinalSuccessGate.verify({
        projectRoot: TEST_DIR,
        mode: "BROWNFIELD",
        contract: null,
        buildSuccess: true,
        brownfieldReport: {
          impactReport: { status: "IMPACT_ANALYSIS_INCOMPLETE" },
        },
      });

      expect(res.status).toBe("BLOCKED");
      expect(res.success).toBe(false);
      expect(res.blockingReason).toContain("Dynamic or unresolved reference");
    });

    it("returns BLOCKED in BROWNFIELD mode when patch plan has missing impacted file", () => {
      const res = FinalSuccessGate.verify({
        projectRoot: TEST_DIR,
        mode: "BROWNFIELD",
        contract: null,
        buildSuccess: true,
        brownfieldReport: {
          patchReport: { status: "MISSING_IMPACTED_FILE" },
        },
      });

      expect(res.status).toBe("BLOCKED");
      expect(res.success).toBe(false);
    });

    it("returns FAILED in BROWNFIELD mode when post-change test suite regresses", () => {
      const res = FinalSuccessGate.verify({
        projectRoot: TEST_DIR,
        mode: "BROWNFIELD",
        contract: null,
        buildSuccess: true,
        brownfieldReport: {
          testReport: { status: "FAIL", passedTests: 0, totalTests: 4 },
        },
      });

      expect(res.status).toBe("FAILED");
      expect(res.success).toBe(false);
    });

    it("returns FAILED in BROWNFIELD mode when build fails", () => {
      const res = FinalSuccessGate.verify({
        projectRoot: TEST_DIR,
        mode: "BROWNFIELD",
        contract: null,
        buildSuccess: false,
        brownfieldReport: {
          buildReport: { status: "FAIL", errors: ["TS2322: Type mismatch"] },
        },
      });

      expect(res.status).toBe("FAILED");
      expect(res.success).toBe(false);
    });

    it("returns FAILED in BROWNFIELD mode when FeatureReality check fails", () => {
      const res = FinalSuccessGate.verify({
        projectRoot: TEST_DIR,
        mode: "BROWNFIELD",
        contract: null,
        buildSuccess: true,
        brownfieldReport: {
          realityReport: { passed: false, score: 40, violations: [{ violation: "Empty handler" }] },
        },
      });

      expect(res.status).toBe("FAILED");
      expect(res.success).toBe(false);
    });
  });

  it("returns FAILED when reality check fails due to mock data", () => {
    const res = FinalSuccessGate.verify({
      projectRoot: TEST_DIR,
      contract: makeContract(),
      buildSuccess: true,
      serverReady: true,
      browserResult: {
        passed: true,
        url: "http://localhost:5173",
        routesChecked: ["/"],
        consoleErrors: [],
        uncaughtExceptions: [],
        failedNetworkRequests: [],
        renderedElementsCount: 20,
      },
      realityResult: {
        passed: false,
        violationCount: 2,
        report: "Mock data found in App.tsx",
        violations: [{ feature: "Scan", file: "src/App.tsx", line: 10, violation: "Hardcoded score", severity: "error" }],
      },
    });

    expect(res.status).toBe("FAILED");
    expect(res.blockingReason).toContain("Reality Checker");
  });
});
