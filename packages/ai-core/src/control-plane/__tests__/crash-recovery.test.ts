import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { JobStore } from "../job-store.js";
import { JobOrchestrator } from "../job-orchestrator.js";
import type { GenerationJob } from "../job.js";

const CRASH_DIR = join(process.cwd(), ".tmp_test_phase12_crash");

describe("AEGIS Phase 12 — Crash Recovery & Disk Reconciliation", () => {
  beforeEach(() => {
    if (existsSync(CRASH_DIR)) rmSync(CRASH_DIR, { recursive: true, force: true });
    mkdirSync(CRASH_DIR, { recursive: true });
    JobOrchestrator.reset();
  });

  afterEach(() => {
    JobOrchestrator.reset();
    if (existsSync(CRASH_DIR)) rmSync(CRASH_DIR, { recursive: true, force: true });
  });

  it("discovers active jobs from disk after crash, reconciles state, and recovers gracefully", () => {
    const job: GenerationJob = {
      jobId: "job_crash_123",
      projectId: "crash_project",
      projectPath: CRASH_DIR,
      generationId: "gen_crash_1",
      requestId: "req_1",
      type: "INITIAL_GENERATION",
      prompt: "Build a gym management application",
      status: "GENERATING", // Active status before simulated crash
      createdAt: new Date().toISOString(),
      currentStage: "GENERATING",
      progress: { totalTasks: 5, completedTasks: 2, failedTasks: 0, activeTasks: 1, percentage: 40 },
      pipelineState: {},
      contractHashes: { arch: "arch123" },
      telemetry: {
        durationMs: 1200,
        totalLlmCalls: 2,
        tokensIn: 100,
        tokensOut: 50,
        cacheHits: 1,
        cacheMisses: 1,
        repairAttempts: 0,
        rollbackCount: 0,
        buildDurationMs: 0,
        runtimeDurationMs: 0,
        apiChecksCount: 0,
        browserChecksCount: 0,
      },
    };

    // Save job to disk simulating active run
    JobStore.saveJob(job);

    // Simulate process restart: discover active jobs from disk
    const recovered = JobStore.recoverActiveJobs(CRASH_DIR);
    expect(recovered.length).toBe(1);
    expect(recovered[0].jobId).toBe("job_crash_123");
    expect(recovered[0].status).toBe("GENERATING");
  });
});
