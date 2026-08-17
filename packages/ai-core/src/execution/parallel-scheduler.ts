/**
 * ParallelScheduler
 *
 * Dependency-aware parallel task scheduler with bounded concurrency,
 * race-free file locking, failure propagation, and self-healing integration.
 */

import type { Task, TaskExecutionStatus } from "../planner/task.js";
import { TaskDAG } from "../planner/task-dag.js";
import { TaskFileLockManager } from "../governance/file-ownership-registry.js";
import { TransactionalRepairSystem } from "../healing/transactional-repair.js";
import { TaskCacheManager } from "./task-cache.js";


export interface ConcurrencyLimits {
  maxConcurrentAgents: number;
  maxConcurrentLLMCalls: number;
  maxConcurrentBuilds: number;
  maxConcurrentBrowsers: number;
}

export interface SchedulerMetrics {
  totalDurationMs: number;
  tasksPassed: number;
  tasksFailed: number;
  tasksBlocked: number;
  tasksCached: number;
  llmCalls: number;
  tokensIn: number;
  tokensOut: number;
  parallelUtilization: number;
  peakConcurrency: number;
  events: Array<{ event: string; taskId?: number; timestamp: string; details?: string }>;
}

export interface SchedulerExecutionResult {
  success: boolean;
  tasks: Task[];
  metrics: SchedulerMetrics;
  failedTaskIds: number[];
  blockedTaskIds: number[];
}

export class ParallelScheduler {
  private readonly limits: ConcurrencyLimits;
  private readonly fileLocks = TaskFileLockManager.getInstance();


  constructor(limits?: Partial<ConcurrencyLimits>) {
    this.limits = {
      maxConcurrentAgents: limits?.maxConcurrentAgents ?? 3,
      maxConcurrentLLMCalls: limits?.maxConcurrentLLMCalls ?? 2,
      maxConcurrentBuilds: limits?.maxConcurrentBuilds ?? 1,
      maxConcurrentBrowsers: limits?.maxConcurrentBrowsers ?? 1,
    };
  }

  /**
   * Execute a TaskDAG in parallel with bounded concurrency and failure isolation.
   */
  public async execute(
    dag: TaskDAG,
    executor: (task: Task) => Promise<{ success: boolean; outputFiles?: string[]; tokensIn?: number; tokensOut?: number; error?: string }>,
    options: {
      projectPath?: string;
      enableCache?: boolean;
      cancellationToken?: { isCancelled: boolean };
    } = {}
  ): Promise<SchedulerExecutionResult> {
    const startTime = Date.now();
    this.fileLocks.reset();

    const allTasks = dag.getAllTasks();
    const taskStates = new Map<number, TaskExecutionStatus>();
    const taskResults = new Map<number, any>();

    for (const t of allTasks) {
      taskStates.set(t.id, "PENDING");
    }

    const running = new Set<number>();
    const passed = new Set<number>();
    const failed = new Set<number>();
    const blocked = new Set<number>();

    const events: SchedulerMetrics["events"] = [];
    let peakConcurrency = 0;
    let totalLlmCalls = 0;
    let totalTokensIn = 0;
    let totalTokensOut = 0;
    let totalCacheHits = 0;

    const logEvent = (event: string, taskId?: number, details?: string) => {
      events.push({
        event,
        taskId,
        timestamp: new Date().toISOString(),
        details,
      });
    };

    while (passed.size + failed.size + blocked.size < allTasks.length) {
      // Check cancellation
      if (options.cancellationToken?.isCancelled) {
        logEvent("SCHEDULER_CANCELLED", undefined, "Execution cancelled by user or signal.");
        for (const t of allTasks) {
          if (taskStates.get(t.id) === "PENDING" || taskStates.get(t.id) === "READY") {
            taskStates.set(t.id, "CANCELLED");
          }
        }
        break;
      }

      // 1. Identify ready tasks
      const readyTasks: Task[] = [];
      for (const task of allTasks) {
        if (taskStates.get(task.id) === "PENDING") {
          const deps = task.dependencies || [];
          const allDepsPassed = deps.every(d => passed.has(d));
          const anyDepFailedOrBlocked = deps.some(d => failed.has(d) || blocked.has(d));

          if (anyDepFailedOrBlocked) {
            taskStates.set(task.id, "BLOCKED");
            blocked.add(task.id);
            logEvent("TASK_BLOCKED", task.id, `Prerequisite dependency failed or blocked.`);
          } else if (allDepsPassed) {
            readyTasks.push(task);
          }
        }
      }

      // Sort ready tasks by priority (lower number = higher priority)
      readyTasks.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

      // 2. Select eligible tasks that don't have file lock conflicts
      const eligibleToLaunch: Task[] = [];
      for (const task of readyTasks) {
        if (running.size + eligibleToLaunch.length >= this.limits.maxConcurrentAgents) {
          break;
        }

        const owned = task.ownedFiles || [];
        const lockCheck = this.fileLocks.canAcquireLocks(task.id, owned);
        if (lockCheck.canLock) {
          this.fileLocks.acquireLocks(task.id, owned);
          eligibleToLaunch.push(task);
        }
      }

      // If no tasks can be launched right now and nothing is running, we are deadlocked
      if (eligibleToLaunch.length === 0 && running.size === 0) {
        if (passed.size + failed.size + blocked.size < allTasks.length) {
          // Remaining tasks are blocked
          for (const t of allTasks) {
            if (taskStates.get(t.id) === "PENDING") {
              taskStates.set(t.id, "BLOCKED");
              blocked.add(t.id);
            }
          }
        }
        break;
      }


      // Track concurrency peak
      const currentConcurrency = running.size + eligibleToLaunch.length;
      if (currentConcurrency > peakConcurrency) {
        peakConcurrency = currentConcurrency;
      }

      // 3. Launch eligible tasks
      const launchPromises = eligibleToLaunch.map(async (task) => {
        taskStates.set(task.id, "RUNNING");
        running.add(task.id);
        logEvent("TASK_STARTED", task.id, `Task "${task.title}" started in worker.`);

        const taskStart = Date.now();

        try {
          // Check task cache if enabled
          let executionResult: { success: boolean; outputFiles?: string[]; tokensIn?: number; tokensOut?: number; error?: string };

          if (options.enableCache && options.projectPath) {
            const cached = TaskCacheManager.get(options.projectPath, task);
            if (cached) {
              logEvent("CACHE_HIT", task.id, `Task #${task.id} result served from deterministic cache.`);
              totalCacheHits++;
              executionResult = { success: true, outputFiles: cached.outputFiles };
            } else {
              executionResult = await executor(task);
              if (executionResult.success) {
                TaskCacheManager.set(options.projectPath, task, executionResult.outputFiles || []);
              }
            }
          } else {
            executionResult = await executor(task);
          }

          task.executionTimeMs = Date.now() - taskStart;
          totalLlmCalls++;
          totalTokensIn += executionResult.tokensIn || 0;
          totalTokensOut += executionResult.tokensOut || 0;

          if (executionResult.success) {
            taskStates.set(task.id, "PASSED");
            task.completed = true;
            task.status = "PASSED";
            passed.add(task.id);
            logEvent("TASK_COMPLETED", task.id, `Task "${task.title}" passed in ${task.executionTimeMs}ms.`);
          } else {
            taskStates.set(task.id, "FAILED");
            task.completed = false;
            task.status = "FAILED";
            failed.add(task.id);
            logEvent("TASK_FAILED", task.id, `Task "${task.title}" failed: ${executionResult.error}`);

            // Propagate failure to all downstream dependents immediately
            const dependents = dag.getDownstreamDependents(task.id);
            for (const depId of dependents) {
              if (!failed.has(depId) && !passed.has(depId)) {
                taskStates.set(depId, "BLOCKED");
                blocked.add(depId);
                logEvent("TASK_BLOCKED", depId, `Blocked due to upstream failure of Task #${task.id}`);
              }
            }
          }
        } catch (err: any) {
          taskStates.set(task.id, "FAILED");
          task.status = "FAILED";
          failed.add(task.id);
          logEvent("TASK_FAILED", task.id, `Unhandled exception in task: ${err.message}`);
        } finally {
          this.fileLocks.releaseLocks(task.id);
          running.delete(task.id);
        }
      });

      // Wait for at least one running task to complete before next scheduling cycle
      if (launchPromises.length > 0) {
        await Promise.race(launchPromises);
      } else if (running.size > 0) {
        // Sleep a tiny tick to yield event loop
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    const totalDurationMs = Date.now() - startTime;
    const finalTasks = allTasks.map(t => ({
      ...t,
      status: taskStates.get(t.id) || "PENDING",
      completed: taskStates.get(t.id) === "PASSED",
    }));

    return {
      success: failed.size === 0 && blocked.size === 0,
      tasks: finalTasks,
      failedTaskIds: Array.from(failed),
      blockedTaskIds: Array.from(blocked),
      metrics: {
        totalDurationMs,
        tasksPassed: passed.size,
        tasksFailed: failed.size,
        tasksBlocked: blocked.size,
        tasksCached: totalCacheHits,
        llmCalls: totalLlmCalls,
        tokensIn: totalTokensIn,
        tokensOut: totalTokensOut,
        parallelUtilization: peakConcurrency / this.limits.maxConcurrentAgents,
        peakConcurrency,
        events,
      },
    };
  }
}
