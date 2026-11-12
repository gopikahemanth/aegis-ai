/**
 * TaskDAGCoordinator
 *
 * Coordinates execution of task DAGs with:
 * - Topological dependency resolution and cycle detection
 * - Partitioned single file write locks via TaskFileLockManager
 * - Bounded retries per failing task (maximum 2 retries)
 * - Dynamic status tracking via JobStateManager
 * - Cancellation check before every task dispatch
 */

import type { Task } from "../planner/task.js";
import { TaskFileLockManager } from "../governance/file-ownership-registry.js";
import { JobStateManager } from "./job-state-manager.js";

export class DAGCycleDetectedError extends Error {
  constructor(message: string) {
    super(`DAG_CYCLE_DETECTED: ${message}`);
    this.name = "DAGCycleDetectedError";
  }
}

export class TaskExecutionError extends Error {
  public readonly taskId: number;
  constructor(taskId: number, message: string) {
    super(`TASK_EXECUTION_FAILED [Task #${taskId}]: ${message}`);
    this.name = "TaskExecutionError";
    this.taskId = taskId;
  }
}

export interface TaskExecutorFunction {
  (task: Task): Promise<{ success: boolean; filesCreated?: string[]; error?: string }>;
}

export interface DAGCoordinatorOptions {
  maxRetriesPerTask?: number;
  onTaskStart?: (task: Task) => void;
  onTaskComplete?: (task: Task, durationMs: number) => void;
  onTaskFail?: (task: Task, error: string) => void;
}

export class TaskDAGCoordinator {
  private readonly lockManager = TaskFileLockManager.getInstance();
  private readonly maxRetries: number;

  constructor(options?: DAGCoordinatorOptions) {
    this.maxRetries = options?.maxRetriesPerTask ?? 2;
  }

  /**
   * Validates that the task dependency graph is a valid DAG (contains no cycles).
   * Throws DAGCycleDetectedError if a circular dependency is detected.
   */
  public static validateNoCycles(tasks: Task[]): void {
    const taskMap = new Map<number, Task>();
    for (const t of tasks) taskMap.set(t.id, t);

    const visited = new Set<number>();
    const recursionStack = new Set<number>();

    const check = (taskId: number, path: number[] = []): void => {
      visited.add(taskId);
      recursionStack.add(taskId);
      path.push(taskId);

      const task = taskMap.get(taskId);
      if (task && task.dependencies) {
        for (const depId of task.dependencies) {
          if (!visited.has(depId)) {
            check(depId, [...path]);
          } else if (recursionStack.has(depId)) {
            const cyclePath = [...path, depId].join(" -> ");
            throw new DAGCycleDetectedError(`Circular task dependency detected: ${cyclePath}`);
          }
        }
      }

      recursionStack.delete(taskId);
    };

    for (const task of tasks) {
      if (!visited.has(task.id)) {
        check(task.id);
      }
    }
  }

  /**
   * Returns tasks in topological order where all dependencies appear before dependents.
   */
  public static getTopologicalOrder(tasks: Task[]): Task[] {
    this.validateNoCycles(tasks);

    const taskMap = new Map<number, Task>();
    for (const t of tasks) taskMap.set(t.id, t);

    const visited = new Set<number>();
    const order: Task[] = [];

    const visit = (taskId: number): void => {
      if (visited.has(taskId)) return;
      visited.add(taskId);

      const task = taskMap.get(taskId);
      if (task?.dependencies) {
        for (const depId of task.dependencies) {
          visit(depId);
        }
      }

      if (task) order.push(task);
    };

    for (const task of tasks) {
      visit(task.id);
    }

    return order;
  }

  public static topologicalSort(tasks: Task[]): Task[] {
    return this.getTopologicalOrder(tasks);
  }

  /**
   * Executes tasks in DAG order.
   * Independent tasks with mutually exclusive file locks can be executed in batches.
   * Tasks with unmet dependencies wait until prerequisites have passed.
   */
  public async executeDAG(
    tasks: Task[],
    executorOrManager: TaskExecutorFunction | JobStateManager,
    managerOrExecutor?: JobStateManager | TaskExecutorFunction,
    reusableTaskIds: Set<number> = new Set()
  ): Promise<{
    success: boolean;
    completedTasks: number[];
    failedTasks: number[];
    completedTaskIds: number[];
    failedTaskIds: number[];
    error?: string;
  }> {
    let executor: TaskExecutorFunction;
    let stateManager: JobStateManager | undefined;

    if (typeof executorOrManager === "function") {
      executor = executorOrManager;
      stateManager = managerOrExecutor as JobStateManager | undefined;
    } else {
      stateManager = executorOrManager as JobStateManager;
      executor = managerOrExecutor as TaskExecutorFunction;
    }
    TaskDAGCoordinator.validateNoCycles(tasks);

    const completed = new Set<number>(reusableTaskIds);
    const failed = new Set<number>();
    const taskMap = new Map<number, Task>();
    for (const t of tasks) taskMap.set(t.id, t);

    // Register all task ownerships
    for (const t of tasks) {
      if (t.ownedFiles && t.ownedFiles.length > 0) {
        this.lockManager.registerTaskOwnership(t.id, t.ownedFiles);
      }
    }

    // Mark reusable tasks as passed in state manager
    if (stateManager) {
      for (const id of reusableTaskIds) {
        stateManager.updateTaskState(id, "PASSED");
      }
    }

    const pending = new Set<number>(tasks.filter(t => !completed.has(t.id)).map(t => t.id));

    while (pending.size > 0) {
      // Check cancellation
      if (stateManager?.isCancelled()) {
        const reason = stateManager.getCancellationReason() || "Execution cancelled";
        console.warn(`[TaskDAGCoordinator] 🛑 DAG halted due to cancellation: ${reason}`);
        return {
          success: false,
          completedTasks: Array.from(completed),
          failedTasks: Array.from(failed),
          completedTaskIds: Array.from(completed),
          failedTaskIds: Array.from(failed),
          error: reason,
        };
      }

      // Find ready tasks: all dependencies are completed
      const readyTasks: Task[] = [];
      for (const taskId of pending) {
        const task = taskMap.get(taskId)!;
        const deps = task.dependencies || [];
        const allDepsSatisfied = deps.every(depId => completed.has(depId));
        const anyDepFailed = deps.some(depId => failed.has(depId));

        if (anyDepFailed) {
          console.warn(`[TaskDAGCoordinator] ⚠️ Task #${task.id} [${task.title}] blocked because prerequisite task failed.`);
          pending.delete(taskId);
          failed.add(taskId);
          stateManager?.updateTaskState(taskId, "BLOCKED", { error: "Prerequisite task failed" });
          continue;
        }

        if (allDepsSatisfied) {
          readyTasks.push(task);
        }
      }

      if (readyTasks.length === 0 && pending.size > 0) {
        // Deadlock / unmet external dependency
        const remaining = Array.from(pending).map(id => `#${id}`).join(", ");
        const error = `DAG stalled: remaining tasks have unresolvable dependencies: [${remaining}]`;
        console.error(`[TaskDAGCoordinator] ❌ ${error}`);
        return {
          success: false,
          completedTasks: Array.from(completed),
          failedTasks: Array.from(failed),
          completedTaskIds: Array.from(completed),
          failedTaskIds: Array.from(failed),
          error,
        };
      }

      // Execute ready tasks sequentially or partitioned by file locks
      for (const task of readyTasks) {
        pending.delete(task.id);

        // Check cancellation before each task
        if (stateManager?.isCancelled()) {
          return {
            success: false,
            completedTasks: Array.from(completed),
            failedTasks: Array.from(failed),
            completedTaskIds: Array.from(completed),
            failedTaskIds: Array.from(failed),
            error: stateManager.getCancellationReason() || "Execution cancelled",
          };
        }

        const taskFiles = task.ownedFiles || [];
        const hasLock = this.lockManager.acquireLocks(task.id, taskFiles);
        if (!hasLock) {
          console.warn(`[TaskDAGCoordinator] ⚠️ Could not acquire lock for Task #${task.id}. Postponing...`);
          pending.add(task.id);
          continue;
        }

        stateManager?.updateTaskState(task.id, "RUNNING");
        console.log(`[TaskDAGCoordinator] ▶️ Executing Task #${task.id}: "${task.title}" (Stage: ${task.stage || "Frontend"})`);

        let taskSuccess = false;
        let lastError = "";
        const startTime = Date.now();

        for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
          try {
            const res = await executor(task);
            if (res.success) {
              taskSuccess = true;
              break;
            } else {
              lastError = res.error || "Task reported failure";
              console.warn(`[TaskDAGCoordinator] ⚠️ Task #${task.id} attempt ${attempt} failed: ${lastError}`);
            }
          } catch (err: any) {
            lastError = err.message;
            console.warn(`[TaskDAGCoordinator] ⚠️ Task #${task.id} attempt ${attempt} threw error: ${lastError}`);
          }
        }

        const durationMs = Date.now() - startTime;
        this.lockManager.releaseLocks(task.id);

        if (taskSuccess) {
          completed.add(task.id);
          task.completed = true;
          task.status = "PASSED";
          stateManager?.updateTaskState(task.id, "PASSED", { durationMs });
          console.log(`[TaskDAGCoordinator] ✓ Completed Task #${task.id}: "${task.title}" in ${durationMs}ms`);
        } else {
          failed.add(task.id);
          task.status = "FAILED";
          stateManager?.updateTaskState(task.id, "FAILED", { error: lastError, durationMs });
          console.error(`[TaskDAGCoordinator] ❌ Task #${task.id} failed after ${this.maxRetries + 1} attempts: ${lastError}`);
          // Stop on critical task failure
          return {
            success: false,
            completedTasks: Array.from(completed),
            failedTasks: Array.from(failed),
            completedTaskIds: Array.from(completed),
            failedTaskIds: Array.from(failed),
            error: `Task #${task.id} ("${task.title}") failed: ${lastError}`,
          };
        }
      }
    }

    return {
      success: failed.size === 0,
      completedTasks: Array.from(completed),
      failedTasks: Array.from(failed),
      completedTaskIds: Array.from(completed),
      failedTaskIds: Array.from(failed),
    };
  }
}
