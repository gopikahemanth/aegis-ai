import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { JobOrchestrator } from "../job-orchestrator.js";
import { TaskCacheManager } from "../../execution/task-cache.js";

const BASE_TEST_DIR = join(process.cwd(), ".tmp_test_phase12_multi");

describe("AEGIS Phase 12 — Multi-Project Jobs & Workspace Isolation", () => {
  beforeEach(() => {
    if (existsSync(BASE_TEST_DIR)) rmSync(BASE_TEST_DIR, { recursive: true, force: true });
    mkdirSync(BASE_TEST_DIR, { recursive: true });
    JobOrchestrator.reset();
  });

  afterEach(() => {
    JobOrchestrator.reset();
    if (existsSync(BASE_TEST_DIR)) rmSync(BASE_TEST_DIR, { recursive: true, force: true });
  });

  it("schedules multiple jobs across distinct projects with complete workspace and cache isolation", async () => {
    const projADir = join(BASE_TEST_DIR, "projectA");
    const projBDir = join(BASE_TEST_DIR, "projectB");
    mkdirSync(projADir, { recursive: true });
    mkdirSync(projBDir, { recursive: true });

    const jobA = JobOrchestrator.createJob({
      projectId: "projectA",
      projectPath: projADir,
      prompt: "Build a gym management app",
    });

    const jobB = JobOrchestrator.createJob({
      projectId: "projectB",
      projectPath: projBDir,
      prompt: "Build a recipe book app",
    });

    expect(jobA.jobId).not.toBe(jobB.jobId);
    expect(jobA.projectId).toBe("projectA");
    expect(jobB.projectId).toBe("projectB");

    // Verify task cache isolation
    const dummyTask: any = {
      id: 1,
      title: "Feature",
      description: "Desc",
      ownedFiles: ["file.ts"],
      allowedFiles: [],
      dependencies: [],
      contractHashes: { arch: "arch" },
    };

    TaskCacheManager.set(projADir, dummyTask, ["fileA.ts"]);
    expect(TaskCacheManager.get(projADir, dummyTask)).toBeDefined();
    expect(TaskCacheManager.get(projBDir, dummyTask)).toBeNull();
  });
});
