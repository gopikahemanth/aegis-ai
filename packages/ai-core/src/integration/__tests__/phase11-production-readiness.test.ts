import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ProductRequirementAnalyzer } from "../../product/product-requirement-analyzer.js";
import { ArchitectureResolver } from "../../governance/architecture-resolver.js";
import { TaskCacheManager } from "../../execution/task-cache.js";
import { RuntimeProcessManager } from "../../execution/runtime-process-manager.js";
import { FinalSuccessGate } from "../../validation/final-success-gate.js";

const PROD_DIR = join(process.cwd(), ".tmp_test_phase11_prod");

describe("AEGIS Phase 11 — Production Readiness, Determinism & Hardening", () => {
  beforeEach(() => {
    if (existsSync(PROD_DIR)) rmSync(PROD_DIR, { recursive: true, force: true });
    mkdirSync(PROD_DIR, { recursive: true });
  });

  afterEach(async () => {
    await RuntimeProcessManager.stopAll();
    if (existsSync(PROD_DIR)) rmSync(PROD_DIR, { recursive: true, force: true });
  });

  it("proves deterministic contract and specification hash calculation", () => {
    const prompt = "Build a gym management application with members and trainers";

    const spec1 = ProductRequirementAnalyzer.analyze(prompt);
    const spec2 = ProductRequirementAnalyzer.analyze(prompt);
    expect(spec1.productSpecificationHash).toBe(spec2.productSpecificationHash);

    const arch1 = ArchitectureResolver.resolve(prompt);
    const arch2 = ArchitectureResolver.resolve(prompt);
    expect(arch1.architectureHash).toBe(arch2.architectureHash);
  });

  it("enforces strict project namespace isolation in task cache", () => {
    const projADir = join(PROD_DIR, "projA");
    const projBDir = join(PROD_DIR, "projB");
    mkdirSync(projADir, { recursive: true });
    mkdirSync(projBDir, { recursive: true });

    const dummyTask: any = {
      id: 1,
      title: "Create Member Component",
      description: "Build MemberList",
      ownedFiles: ["src/MemberList.tsx"],
      allowedFiles: [],
      dependencies: [],
      contractHashes: { arch: "arch123" },
    };

    TaskCacheManager.set(projADir, dummyTask, ["src/MemberList.tsx"]);

    // Lookup in Project A succeeds
    expect(TaskCacheManager.get(projADir, dummyTask)).toBeDefined();

    // Lookup in Project B is a cache miss
    expect(TaskCacheManager.get(projBDir, dummyTask)).toBeNull();
  });


  it("rejects fake implementations during FinalSuccessGate evaluation", () => {
    const fakeResult = FinalSuccessGate.verify({
      projectRoot: PROD_DIR,
      contract: null, // Missing architecture contract
      buildSuccess: false, // Build failed
      serverReady: false,
      browserResult: null,
      apiReport: null,
      realityResult: {
        passed: false,
        totalChecks: 3,
        passedChecks: 0,
        issues: [{ file: "MemberList.tsx", issue: "Fake placeholder component with no real API calls", severity: "CRITICAL" }],
        checkedFiles: [],
        summary: "Fake implementation detected",
      },
    });

    expect(fakeResult.status).toBe("FAILED");
    expect(fakeResult.success).toBe(false);
  });
});
