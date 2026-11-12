import { describe, it, expect, beforeEach } from "vitest";
import {
  TaskDAGCoordinator,
  DAGCycleDetectedError,
  TaskExecutionError,
} from "../task-dag-coordinator.js";
import { JobStateManager } from "../job-state-manager.js";
import type { Task } from "../../planner/task.js";
import { join } from "node:path";
import { rmSync, existsSync, mkdirSync } from "node:fs";

const TEST_DIR = join(process.cwd(), ".tmp_test_dag_coord");

describe("TaskDAGCoordinator — Dependency Graph & File-Locked Execution", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  it("detects circular dependencies in task graphs and throws DAGCycleDetectedError", () => {
    const cyclicTasks: Task[] = [
      { id: 1, title: "Task 1", completed: false, dependencies: [2] },
      { id: 2, title: "Task 2", completed: false, dependencies: [3] },
      { id: 3, title: "Task 3", completed: false, dependencies: [1] },
    ];

    expect(() => TaskDAGCoordinator.validateNoCycles(cyclicTasks)).toThrow(
      DAGCycleDetectedError
    );
  });

  it("sorts acyclic dependencies topologically", () => {
    const tasks: Task[] = [
      { id: 3, title: "UI App", completed: false, dependencies: [2] },
      { id: 1, title: "Database", completed: false, dependencies: [] },
      { id: 2, title: "Backend API", completed: false, dependencies: [1] },
    ];

    const sorted = TaskDAGCoordinator.topologicalSort(tasks);
    const sortedIds = sorted.map(t => t.id);

    expect(sortedIds).toEqual([1, 2, 3]);
  });

  it("executes tasks sequentially when dependent, updating JobStateManager", async () => {
    const manager = new JobStateManager(TEST_DIR);
    manager.createJob("dag_job_1", "Test DAG execution");

    const tasks: Task[] = [
      { id: 1, title: "Database Schema", completed: false, dependencies: [], ownedFiles: ["prisma/schema.prisma"] },
      { id: 2, title: "API Server", completed: false, dependencies: [1], ownedFiles: ["server/index.ts"] },
    ];

    const coordinator = new TaskDAGCoordinator({ maxRetriesPerTask: 2 });
    const executionOrder: number[] = [];

    const result = await coordinator.executeDAG(tasks, manager, async (task) => {
      executionOrder.push(task.id);
      return { success: true, filesCreated: task.ownedFiles };
    });

    expect(result.success).toBe(true);
    expect(result.failedTaskIds).toHaveLength(0);
    expect(executionOrder).toEqual([1, 2]);

    const job = manager.getJob()!;
    expect(job.completedTaskIds).toContain(1);
    expect(job.completedTaskIds).toContain(2);
  });

  it("retries failing tasks up to maxRetries before failing", async () => {
    const manager = new JobStateManager(TEST_DIR);
    manager.createJob("dag_job_2", "Retry test");

    const tasks: Task[] = [
      { id: 10, title: "Flaky Task", completed: false, dependencies: [], ownedFiles: ["src/flaky.ts"] },
    ];

    let attempts = 0;
    const coordinator = new TaskDAGCoordinator({ maxRetriesPerTask: 2 });

    const result = await coordinator.executeDAG(tasks, manager, async () => {
      attempts++;
      if (attempts < 2) {
        return { success: false, error: "Transient network issue" };
      }
      return { success: true };
    });

    expect(result.success).toBe(true);
    expect(attempts).toBe(2);
    expect(manager.getJob()!.completedTaskIds).toContain(10);
  });
});
