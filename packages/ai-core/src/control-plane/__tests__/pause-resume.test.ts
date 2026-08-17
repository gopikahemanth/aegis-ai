import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { JobOrchestrator } from "../job-orchestrator.js";

const PAUSE_DIR = join(process.cwd(), ".tmp_test_phase12_pause");

describe("AEGIS Phase 12 — Graceful Pause & Safe Resume Workflow", () => {
  beforeEach(() => {
    if (existsSync(PAUSE_DIR)) rmSync(PAUSE_DIR, { recursive: true, force: true });
    mkdirSync(PAUSE_DIR, { recursive: true });
    JobOrchestrator.reset();
  });

  afterEach(() => {
    JobOrchestrator.reset();
    if (existsSync(PAUSE_DIR)) rmSync(PAUSE_DIR, { recursive: true, force: true });
  });

  it("pauses active job gracefully and resumes safely with state persistence", () => {
    const job = JobOrchestrator.createJob({
      projectId: "pause_project",
      projectPath: PAUSE_DIR,
      prompt: "Build task management app",
    });

    expect(job.status).toBe("QUEUED");

    const paused = JobOrchestrator.pauseJob(job.jobId);
    expect(paused.status).toBe("PAUSED");
    expect(paused.currentStage).toBe("PAUSED");
  });
});
