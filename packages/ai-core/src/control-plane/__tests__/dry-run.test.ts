import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { JobOrchestrator } from "../job-orchestrator.js";

const DRY_DIR = join(process.cwd(), ".tmp_test_phase12_dry");

describe("AEGIS Phase 12 — Dry Run & Pre-Execution Plan", () => {
  beforeEach(() => {
    if (existsSync(DRY_DIR)) rmSync(DRY_DIR, { recursive: true, force: true });
    mkdirSync(DRY_DIR, { recursive: true });
    JobOrchestrator.reset();
  });

  afterEach(() => {
    JobOrchestrator.reset();
    if (existsSync(DRY_DIR)) rmSync(DRY_DIR, { recursive: true, force: true });
  });

  it("generates a complete pre-execution dry-run plan with zero disk mutations", () => {
    const job = JobOrchestrator.createJob({
      projectId: "dry_project",
      projectPath: DRY_DIR,
      prompt: "Build a gym management application with members and trainers",
      type: "DRY_RUN",
    });

    const dryRunResult = JobOrchestrator.runDryRun(job.jobId);

    expect(dryRunResult.status).toBe("DRY_RUN_COMPLETED");
    expect(dryRunResult.productSpecification).toBeDefined();
    expect(dryRunResult.architectureContract).toBeDefined();
    expect(dryRunResult.domainContract).toBeDefined();
    expect(dryRunResult.fileGraph).toBeDefined();

    // Verify zero source files created on disk
    expect(existsSync(join(DRY_DIR, "src"))).toBe(false);
  });
});
