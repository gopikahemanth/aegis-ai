import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { JobStateManager } from "../job-state-manager.js";

const TEST_DIR = join(process.cwd(), ".tmp_test_job_state");

describe("JobStateManager — Execution Persistence & Resume Engine", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("initializes a generation job and transitions through stages", () => {
    const manager = new JobStateManager(TEST_DIR);
    const job = manager.createJob("job_001", "Build real estate CRM", "arch_hash_1");

    expect(job.status).toBe("INITIALIZING");
    expect(job.architectureHash).toBe("arch_hash_1");

    manager.transitionStage("Architecture", "PLANNING");
    expect(manager.getStatus()).toBe("PLANNING");

    // Check on-disk persistence
    const stateFile = join(TEST_DIR, ".aegis", "job-state.json");
    expect(existsSync(stateFile)).toBe(true);
    const data = JSON.parse(readFileSync(stateFile, "utf-8"));
    expect(data.status).toBe("PLANNING");
    expect(data.currentStage).toBe("Architecture");
  });

  it("registers tasks and accurately tracks task progression", () => {
    const manager = new JobStateManager(TEST_DIR);
    manager.createJob("job_002", "Build blog", "arch_hash_2");

    manager.registerTasks([
      { id: 1, title: "Schema", completed: false, ownedFiles: ["prisma/schema.prisma"] },
      { id: 2, title: "Router", completed: false, ownedFiles: ["server/index.ts"] },
    ]);

    let snapshot = manager.getJob()!;
    expect(snapshot.tasks).toHaveLength(2);
    expect(snapshot.tasks[0].status).toBe("PENDING");

    manager.updateTaskState(1, "RUNNING");
    expect(manager.getJob()!.tasks[0].status).toBe("RUNNING");

    manager.updateTaskState(1, "PASSED", { durationMs: 120 });
    snapshot = manager.getJob()!;
    expect(snapshot.tasks[0].status).toBe("PASSED");
    expect(snapshot.completedTaskIds).toContain(1);

    // Fail task 2
    manager.updateTaskState(2, "FAILED", { error: "Syntax error in routes" });
    snapshot = manager.getJob()!;
    expect(snapshot.tasks[1].status).toBe("FAILED");
    expect(snapshot.failedTaskIds).toContain(2);
    expect(snapshot.tasks[1].retryCount).toBe(1);
  });

  it("handles cancellation and records cancellation reason", () => {
    const manager = new JobStateManager(TEST_DIR);
    manager.createJob("job_003", "Test job");

    expect(manager.isCancelled()).toBe(false);
    manager.cancel("User cancelled via CLI");

    expect(manager.isCancelled()).toBe(true);
    expect(manager.getStatus()).toBe("CANCELLED");
    expect(manager.getCancellationReason()).toBe("User cancelled via CLI");
  });

  it("evaluates resume readiness across architecture contract changes", () => {
    const manager = new JobStateManager(TEST_DIR);
    manager.createJob("job_004", "E-commerce app", "hash_alpha");

    manager.registerTasks([
      { id: 1, title: "Prisma Schema", completed: false, ownedFiles: ["prisma/schema.prisma"] },
      { id: 2, title: "Frontend", completed: false, ownedFiles: ["src/App.tsx"] },
    ]);
    manager.updateTaskState(1, "PASSED");

    // Same architecture hash -> can resume
    const resValid = JobStateManager.canResume(TEST_DIR, "hash_alpha");
    expect(resValid.canResume).toBe(true);
    expect(resValid.completedTaskIds).toContain(1);

    // Different architecture hash -> cannot resume, must restart
    const resInvalid = JobStateManager.canResume(TEST_DIR, "hash_beta");
    expect(resInvalid.canResume).toBe(false);
    expect(resInvalid.reason).toContain("Architecture mismatch");
  });
});
