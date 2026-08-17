import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { JobOrchestrator } from "../job-orchestrator.js";
import { JobStore } from "../job-store.js";
import type { GenerationJob } from "../job.js";

const DIFF_DIR = join(process.cwd(), ".tmp_test_phase12_diff");

describe("AEGIS Phase 12 — Generation Lineage & Diff Comparison", () => {
  beforeEach(() => {
    if (existsSync(DIFF_DIR)) rmSync(DIFF_DIR, { recursive: true, force: true });
    mkdirSync(DIFF_DIR, { recursive: true });
    JobOrchestrator.reset();
  });

  afterEach(() => {
    JobOrchestrator.reset();
    if (existsSync(DIFF_DIR)) rmSync(DIFF_DIR, { recursive: true, force: true });
  });

  it("calculates accurate diff between G1 and G2 generation states", () => {
    const jobG1: GenerationJob = {
      jobId: "job_g1",
      projectId: "diff_proj",
      projectPath: DIFF_DIR,
      generationId: "gen_g1",
      requestId: "req_1",
      type: "INITIAL_GENERATION",
      prompt: "Build app",
      status: "COMPLETED",
      createdAt: new Date(Date.now() - 10000).toISOString(),
      currentStage: "COMPLETED",
      progress: { totalTasks: 1, completedTasks: 1, failedTasks: 0, activeTasks: 0, percentage: 100 },
      pipelineState: { TASK_EXECUTION: { details: { createdFiles: ["src/App.tsx"], modifiedFiles: [], deletedFiles: [] } } },
      contractHashes: { arch: "arch1" },
      telemetry: { durationMs: 100, totalLlmCalls: 1, tokensIn: 10, tokensOut: 10, cacheHits: 0, cacheMisses: 1, repairAttempts: 0, rollbackCount: 0, buildDurationMs: 0, runtimeDurationMs: 0, apiChecksCount: 0, browserChecksCount: 0 },
    };

    const jobG2: GenerationJob = {
      jobId: "job_g2",
      projectId: "diff_proj",
      projectPath: DIFF_DIR,
      generationId: "gen_g2",
      parentGenerationId: "gen_g1",
      requestId: "req_2",
      type: "INCREMENTAL_EVOLUTION",
      prompt: "Add styles",
      status: "COMPLETED",
      createdAt: new Date().toISOString(),
      currentStage: "COMPLETED",
      progress: { totalTasks: 1, completedTasks: 1, failedTasks: 0, activeTasks: 0, percentage: 100 },
      pipelineState: { TASK_EXECUTION: { details: { createdFiles: ["src/theme.css"], modifiedFiles: ["src/App.tsx"], deletedFiles: [] } } },
      contractHashes: { arch: "arch1" },
      telemetry: { durationMs: 100, totalLlmCalls: 1, tokensIn: 10, tokensOut: 10, cacheHits: 1, cacheMisses: 0, repairAttempts: 0, rollbackCount: 0, buildDurationMs: 0, runtimeDurationMs: 0, apiChecksCount: 0, browserChecksCount: 0 },
    };

    JobStore.saveJob(jobG1);
    JobStore.saveJob(jobG2);

    const diff = JobOrchestrator.getGenerationDiff(DIFF_DIR, "gen_g1", "gen_g2");

    expect(diff.filesCreated).toContain("src/theme.css");
    expect(diff.filesModified).toContain("src/App.tsx");
  });
});
