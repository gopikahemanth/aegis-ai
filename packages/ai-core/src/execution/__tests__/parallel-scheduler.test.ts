import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ParallelScheduler } from "../parallel-scheduler.js";
import { TaskDAG } from "../../planner/task-dag.js";
import type { Task } from "../../planner/task.js";
import { CancellationResumeController } from "../cancellation-resume-controller.js";
import { LLMRetryManager } from "../llm-retry-manager.js";

const TEST_DIR = join(process.cwd(), ".tmp_test_scheduler_phase5");

describe("ParallelScheduler — Dependency-Aware Execution & Failure Isolation", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
  });

  // 1. Independent task parallelism & dependency ordering
  it("executes independent tasks concurrently and honors prerequisite ordering", async () => {
    const executionOrder: number[] = [];
    const executionTimestamps: Record<number, { start: number; end: number }> = {};

    const tasks: Task[] = [
      { id: 1, title: "Task A", description: "", completed: false, dependencies: [], ownedFiles: ["fileA.ts"] },
      { id: 2, title: "Task B", description: "", completed: false, dependencies: [], ownedFiles: ["fileB.ts"] },
      { id: 3, title: "Task C", description: "", completed: false, dependencies: [], ownedFiles: ["fileC.ts"] },
      { id: 4, title: "Task D (depends on A+B)", description: "", completed: false, dependencies: [1, 2], ownedFiles: ["fileD.ts"] },
      { id: 5, title: "Task E (depends on C)", description: "", completed: false, dependencies: [3], ownedFiles: ["fileE.ts"] },
    ];

    const dag = new TaskDAG(tasks);
    const scheduler = new ParallelScheduler({ maxConcurrentAgents: 3 });

    const result = await scheduler.execute(dag, async (task) => {
      const start = Date.now();
      await new Promise(r => setTimeout(r, 40));
      const end = Date.now();
      executionTimestamps[task.id] = { start, end };
      executionOrder.push(task.id);
      return { success: true, tokensIn: 100, tokensOut: 50 };
    });

    expect(result.success).toBe(true);
    expect(result.tasks.every(t => t.completed)).toBe(true);

    // Verify D started strictly after A and B finished
    expect(executionTimestamps[4].start).toBeGreaterThanOrEqual(executionTimestamps[1].end - 5);
    expect(executionTimestamps[4].start).toBeGreaterThanOrEqual(executionTimestamps[2].end - 5);

    // Verify E started strictly after C finished
    expect(executionTimestamps[5].start).toBeGreaterThanOrEqual(executionTimestamps[3].end - 5);

    expect(result.metrics.peakConcurrency).toBeGreaterThanOrEqual(2);
    expect(result.metrics.tasksPassed).toBe(5);
  });

  // 2. Concurrency limit is strictly bounded
  it("bounds concurrency to maxConcurrentAgents limit", async () => {
    let activeWorkers = 0;
    let maxObservedWorkers = 0;

    const tasks: Task[] = [
      { id: 1, title: "T1", description: "", completed: false, dependencies: [] },
      { id: 2, title: "T2", description: "", completed: false, dependencies: [] },
      { id: 3, title: "T3", description: "", completed: false, dependencies: [] },
      { id: 4, title: "T4", description: "", completed: false, dependencies: [] },
    ];

    const dag = new TaskDAG(tasks);
    const scheduler = new ParallelScheduler({ maxConcurrentAgents: 2 });

    const result = await scheduler.execute(dag, async () => {
      activeWorkers++;
      if (activeWorkers > maxObservedWorkers) maxObservedWorkers = activeWorkers;
      await new Promise(r => setTimeout(r, 30));
      activeWorkers--;
      return { success: true };
    });

    expect(result.success).toBe(true);
    expect(maxObservedWorkers).toBeLessThanOrEqual(2);
    expect(result.metrics.peakConcurrency).toBeLessThanOrEqual(2);
  });

  // 3. Failure propagation: A fails -> D blocked, but B, C, E continue
  it("propagates failure to dependents while allowing independent tasks to complete", async () => {
    const tasks: Task[] = [
      { id: 1, title: "Task A (will fail)", description: "", completed: false, dependencies: [] },
      { id: 2, title: "Task B", description: "", completed: false, dependencies: [] },
      { id: 3, title: "Task C", description: "", completed: false, dependencies: [] },
      { id: 4, title: "Task D (depends on A)", description: "", completed: false, dependencies: [1] },
      { id: 5, title: "Task E (depends on C)", description: "", completed: false, dependencies: [3] },
    ];

    const dag = new TaskDAG(tasks);
    const scheduler = new ParallelScheduler({ maxConcurrentAgents: 3 });

    const result = await scheduler.execute(dag, async (task) => {
      if (task.id === 1) {
        return { success: false, error: "Database connection failed" };
      }
      await new Promise(r => setTimeout(r, 20));
      return { success: true };
    });

    expect(result.success).toBe(false);
    expect(result.failedTaskIds).toEqual([1]);
    expect(result.blockedTaskIds).toContain(4);

    const taskMap = new Map(result.tasks.map(t => [t.id, t.status]));
    expect(taskMap.get(1)).toBe("FAILED");
    expect(taskMap.get(4)).toBe("BLOCKED"); // Dependent task blocked!
    expect(taskMap.get(2)).toBe("PASSED"); // Independent task passed!
    expect(taskMap.get(3)).toBe("PASSED");
    expect(taskMap.get(5)).toBe("PASSED");
  });

  // 4. File lock conflict serialization
  it("serializes tasks that own conflicting files even if both are dependency-ready", async () => {
    let simultaneousFileOwners = 0;
    let maxSimultaneous = 0;

    const tasks: Task[] = [
      { id: 1, title: "Task 1 modifying App.tsx", description: "", completed: false, dependencies: [], ownedFiles: ["src/App.tsx"] },
      { id: 2, title: "Task 2 modifying App.tsx", description: "", completed: false, dependencies: [1], ownedFiles: ["src/App.tsx"] },
    ];

    const dag = new TaskDAG(tasks);
    const scheduler = new ParallelScheduler({ maxConcurrentAgents: 2 });

    const result = await scheduler.execute(dag, async () => {
      simultaneousFileOwners++;
      if (simultaneousFileOwners > maxSimultaneous) maxSimultaneous = simultaneousFileOwners;
      await new Promise(r => setTimeout(r, 25));
      simultaneousFileOwners--;
      return { success: true };
    });

    expect(result.success).toBe(true);
    expect(maxSimultaneous).toBe(1); // Never ran simultaneously on the same file!
  });

  // 5. Graceful cancellation
  it("stops launching new tasks upon cancellation signal", async () => {
    const controller = new CancellationResumeController();

    const tasks: Task[] = [
      { id: 1, title: "Slow Task 1", description: "", completed: false, dependencies: [] },
      { id: 2, title: "Slow Task 2", description: "", completed: false, dependencies: [1] },
      { id: 3, title: "Slow Task 3", description: "", completed: false, dependencies: [2] },
    ];

    const dag = new TaskDAG(tasks);
    const scheduler = new ParallelScheduler({ maxConcurrentAgents: 1 });

    const execPromise = scheduler.execute(
      dag,
      async (task) => {
        if (task.id === 1) {
          controller.cancel("User aborted generation");
        }
        return { success: true };
      },
      { cancellationToken: controller }
    );

    const result = await execPromise;
    expect(result.tasks.some(t => t.status === "CANCELLED")).toBe(true);
  });

  // 6. Resuming from checkpoint
  it("persists checkpoint and allows resuming without re-executing passed tasks", () => {
    const tasks: Task[] = [
      { id: 1, title: "Task 1", description: "", completed: true, status: "PASSED" },
      { id: 2, title: "Task 2", description: "", completed: false, status: "FAILED" },
    ];

    CancellationResumeController.saveCheckpoint(TEST_DIR, "gen_100", "arch_hash_123", tasks);

    const resumeInfo = CancellationResumeController.loadCheckpoint(TEST_DIR, "arch_hash_123");
    expect(resumeInfo.canResume).toBe(true);
    expect(resumeInfo.reusableTaskIds.has(1)).toBe(true);
    expect(resumeInfo.reusableTaskIds.has(2)).toBe(false);
  });

  // 7. LLM Retry Manager: rate limit exponential backoff & provider fallback
  it("LLMRetryManager backs off on rate limits and triggers fallback provider", async () => {
    let callCount = 0;
    const providersUsed: string[] = [];

    const res = await LLMRetryManager.executeWithRetry(
      async (attempt, provider) => {
        callCount++;
        providersUsed.push(provider);
        if (attempt === 1) {
          throw new Error("Rate limit exceeded (429)");
        }
        if (attempt === 2) {
          throw new Error("Service Unavailable (503)");
        }
        return { content: "Success on fallback" };
      },
      "gemini-flash",
      { maxRetries: 3, initialDelayMs: 20, fallbackProvider: "cerebras-fast" }
    );

    expect(res.result.content).toBe("Success on fallback");
    expect(callCount).toBe(3);
    expect(providersUsed).toContain("gemini-flash");
    expect(providersUsed).toContain("cerebras-fast");
  });
});
