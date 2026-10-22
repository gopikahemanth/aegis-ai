import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { FinalSuccessGate } from "../final-success-gate.js";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FIXTURE_DIR = join(process.cwd(), "scratch", "test-gate-milestone1");

describe("FinalSuccessGate — Milestone 1 Honest Acceptance Gate", () => {
  beforeEach(() => {
    rmSync(FIXTURE_DIR, { recursive: true, force: true });
    mkdirSync(FIXTURE_DIR, { recursive: true });
    mkdirSync(join(FIXTURE_DIR, ".aegis"), { recursive: true });
    mkdirSync(join(FIXTURE_DIR, "src"), { recursive: true });
    mkdirSync(join(FIXTURE_DIR, "prisma"), { recursive: true });

    // Base valid setup
    writeFileSync(join(FIXTURE_DIR, "prisma", "schema.prisma"), "model User { id String @id }\nmodel Task { id String @id }");
    writeFileSync(join(FIXTURE_DIR, "src", "App.tsx"), "export default function App() { return <div>App</div>; }");
    writeFileSync(join(FIXTURE_DIR, ".aegis", "domain-contract.json"), JSON.stringify({
      domainName: "task-mgmt",
      entities: [{ name: "Task" }]
    }));
  });

  afterEach(() => {
    rmSync(FIXTURE_DIR, { recursive: true, force: true });
  });

  const baseContract: any = {
    frontend: { framework: "React-Vite" },
    backend: { framework: "Express" },
    database: { provider: "postgresql" },
    clientOnly: false,
  };

  it("Test 1: All mandatory checks pass -> status SUCCESS, success true", () => {
    const res = FinalSuccessGate.verify({
      projectRoot: FIXTURE_DIR,
      contract: baseContract,
      buildSuccess: true,
      serverReady: true,
      browserResult: { passed: true, routesChecked: ["/"], renderedElementsCount: 10, uncaughtExceptions: [] } as any,
      apiReport: { passed: true, totalSteps: 2, passedSteps: 2, failedSteps: 0, http500Count: 0 } as any,
      realityResult: { passed: true, violationCount: 0 } as any,
      databaseBlocked: false,
      testReport: {
        status: "PASS",
        executionStatus: "PASS",
        framework: "vitest",
        totalTests: 4,
        passedTests: 4,
        failedTests: 0,
        skippedTests: 0,
        errorCount: 0,
        durationMs: 500,
        failedTestNames: [],
        output: "4 passed",
        exitCode: 0,
        failureCategory: "NONE",
      },
      runtimeReport: {
        passed: true,
        status: "SUCCESS",
        evidenceSummary: "All user scenarios passed",
      } as any,
    });

    expect(res.status).toBe("SUCCESS");
    expect(res.success).toBe(true);
    expect(res.blockingReason).toBeUndefined();
  });

  it("Test 2: Mandatory in-project test suite fails -> status FAILED, success false", () => {
    const res = FinalSuccessGate.verify({
      projectRoot: FIXTURE_DIR,
      contract: baseContract,
      buildSuccess: true,
      serverReady: true,
      browserResult: { passed: true, routesChecked: ["/"], renderedElementsCount: 10, uncaughtExceptions: [] } as any,
      apiReport: { passed: true, totalSteps: 2, passedSteps: 2, failedSteps: 0, http500Count: 0 } as any,
      realityResult: { passed: true, violationCount: 0 } as any,
      databaseBlocked: false,
      testReport: {
        status: "FAIL",
        executionStatus: "FAIL",
        framework: "vitest",
        totalTests: 4,
        passedTests: 3,
        failedTests: 1,
        skippedTests: 0,
        errorCount: 0,
        durationMs: 500,
        failedTestNames: ["orders CRUD lifecycle"],
        output: "1 failed",
        exitCode: 1,
        failureCategory: "ASSERTION_FAILURE",
        failureReason: "1 test(s) failed: orders CRUD lifecycle",
      },
      runtimeReport: {
        passed: true,
        status: "SUCCESS",
        evidenceSummary: "All user scenarios passed",
      } as any,
    });

    expect(res.status).toBe("FAILED");
    expect(res.success).toBe(false);
    expect(res.blockingReason).toContain("In-Project Test Suite");
  });

  it("Test 3: Mandatory in-project test suite has abnormal exit (exit code 1 with passing counts) -> FAILED", () => {
    const res = FinalSuccessGate.verify({
      projectRoot: FIXTURE_DIR,
      contract: baseContract,
      buildSuccess: true,
      serverReady: true,
      browserResult: { passed: true, routesChecked: ["/"], renderedElementsCount: 10, uncaughtExceptions: [] } as any,
      apiReport: { passed: true, totalSteps: 2, passedSteps: 2, failedSteps: 0, http500Count: 0 } as any,
      realityResult: { passed: true, violationCount: 0 } as any,
      databaseBlocked: false,
      testReport: {
        status: "FAIL",
        executionStatus: "ABNORMAL_EXIT",
        framework: "vitest",
        totalTests: 4,
        passedTests: 4,
        failedTests: 0,
        skippedTests: 0,
        errorCount: 0,
        durationMs: 500,
        failedTestNames: [],
        output: "4 passed",
        exitCode: 1,
        failureCategory: "ABNORMAL_EXIT",
        failureReason: "Process exited with abnormal code 1 despite 4 passed assertions.",
      },
      runtimeReport: {
        passed: true,
        status: "SUCCESS",
        evidenceSummary: "All user scenarios passed",
      } as any,
    });

    expect(res.status).toBe("FAILED");
    expect(res.success).toBe(false);
    expect(res.blockingReason).toContain("In-Project Test Suite");
  });

  it("Test 4: Mandatory runtime acceptance fails -> status FAILED, success false", () => {
    const res = FinalSuccessGate.verify({
      projectRoot: FIXTURE_DIR,
      contract: baseContract,
      buildSuccess: true,
      serverReady: true,
      browserResult: { passed: true, routesChecked: ["/"], renderedElementsCount: 10, uncaughtExceptions: [] } as any,
      apiReport: { passed: true, totalSteps: 2, passedSteps: 2, failedSteps: 0, http500Count: 0 } as any,
      realityResult: { passed: true, violationCount: 0 } as any,
      databaseBlocked: false,
      testReport: {
        status: "PASS",
        executionStatus: "PASS",
        framework: "vitest",
        totalTests: 4,
        passedTests: 4,
        failedTests: 0,
        skippedTests: 0,
        errorCount: 0,
        durationMs: 500,
        failedTestNames: [],
        output: "4 passed",
        exitCode: 0,
        failureCategory: "NONE",
      },
      runtimeReport: {
        passed: false,
        status: "FAILED",
        evidenceSummary: "User journey failed: Could not mutate task status",
      } as any,
    });

    expect(res.status).toBe("FAILED");
    expect(res.success).toBe(false);
    expect(res.blockingReason).toContain("Runtime Acceptance & Scenarios");
  });

  it("Test 5: Mandatory in-project test suite skipped -> status FAILED, success false", () => {
    const res = FinalSuccessGate.verify({
      projectRoot: FIXTURE_DIR,
      contract: baseContract,
      buildSuccess: true,
      serverReady: true,
      browserResult: { passed: true, routesChecked: ["/"], renderedElementsCount: 10, uncaughtExceptions: [] } as any,
      apiReport: { passed: true, totalSteps: 2, passedSteps: 2, failedSteps: 0, http500Count: 0 } as any,
      realityResult: { passed: true, violationCount: 0 } as any,
      databaseBlocked: false,
      testReport: {
        status: "SKIPPED",
        executionStatus: "SKIPPED",
        framework: "vitest",
        totalTests: 2,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 2,
        errorCount: 0,
        durationMs: 200,
        failedTestNames: [],
        output: "2 skipped",
        exitCode: 0,
        failureCategory: "NONE",
      },
      runtimeReport: {
        passed: true,
        status: "SUCCESS",
        evidenceSummary: "All user scenarios passed",
      } as any,
    });

    expect(res.status).toBe("FAILED");
    expect(res.success).toBe(false);
  });

  it("Test 6: Database environment blocked while code is valid -> status BLOCKED, not false SUCCESS", () => {
    const res = FinalSuccessGate.verify({
      projectRoot: FIXTURE_DIR,
      contract: baseContract,
      buildSuccess: true,
      serverReady: false,
      browserResult: { passed: true, routesChecked: ["/"], renderedElementsCount: 10, uncaughtExceptions: [] } as any,
      apiReport: null,
      realityResult: { passed: true, violationCount: 0 } as any,
      databaseBlocked: true, // DB connection refused (environment error)
      testReport: {
        status: "PASS",
        executionStatus: "PASS",
        framework: "vitest",
        totalTests: 4,
        passedTests: 4,
        failedTests: 0,
        skippedTests: 0,
        errorCount: 0,
        durationMs: 500,
        failedTestNames: [],
        output: "4 passed",
        exitCode: 0,
        failureCategory: "NONE",
      },
      runtimeReport: null,
    });

    expect(res.status).toBe("BLOCKED");
    expect(res.success).toBe(false);
    expect(res.blockingReason).toContain("External database unavailable");
  });
});
