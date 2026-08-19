import type { ExecutionTask } from "./execution-loop.js";

export interface SchedulingOptions {
  maxConcurrency?: number;
  autoOptimize?: boolean;
}

export class DependencyScheduler {
  public static readonly DEFAULT_MAX_CONCURRENCY = 3;

  /** Ensure task dependencies only point to lower task IDs to prevent cycles */
  public static sanitizeDependencies<T extends ExecutionTask>(tasks: T[]): T[] {
    const validIds = new Set(tasks.map(t => t.id));
    return tasks.map(task => ({
      ...task,
      dependencies: (task.dependencies ?? [])
        .map(d => Number(d))
        .filter(d => !isNaN(d) && d !== task.id && d < task.id && validIds.has(d)),
    }));
  }

  /**
   * Optimizes task dependencies by decoupling independent Frontend UI component tasks
   * from Backend implementation tasks when both only require foundation data models.
   */
  public static optimizeTaskDependencies<T extends ExecutionTask>(tasks: T[]): T[] {
    const sanitized = DependencyScheduler.sanitizeDependencies(tasks);
    if (sanitized.length <= 2) return sanitized;

    // Find database/foundation task (usually id 1)
    const dbTask = sanitized.find(t => {
      const title = (t.title || "").toLowerCase();
      const stage = String(t.stage || "").toLowerCase();
      return stage === "database" || stage === "datamodeling" || title.includes("database") || title.includes("prisma") || title.includes("schema");
    });

    if (!dbTask) return sanitized;

    return sanitized.map(task => {
      const title = (task.title || "").toLowerCase();
      const stage = String(task.stage || "").toLowerCase();
      const isFrontendUiOnly = (stage === "frontend" || title.includes("frontend") || title.includes("ui") || title.includes("component")) &&
                               !title.includes("routing") && !title.includes("integration") && !title.includes("shell") && !title.includes("app.tsx");

      if (isFrontendUiOnly && task.id > dbTask.id) {
        // Frontend UI components only strictly depend on the Database schema/types foundation
        const deps = task.dependencies ?? [];
        if (deps.includes(dbTask.id)) {
          // Filter out backend tasks from this frontend UI task's dependencies
          const refinedDeps = deps.filter(depId => {
            const depTask = sanitized.find(t => t.id === depId);
            if (!depTask) return false;
            if (depTask.id === dbTask.id) return true;
            const depTitle = (depTask.title || "").toLowerCase();
            const isBackend = depTitle.includes("backend") || depTitle.includes("controller") || depTitle.includes("express") || depTitle.includes("service");
            return !isBackend;
          });
          return {
            ...task,
            dependencies: refinedDeps.length > 0 ? refinedDeps : [dbTask.id],
          };
        }
      }
      return task;
    });
  }

  /** Infer canonical owned files for a task to prevent write conflicts */
  public static getOwnedFiles(task: ExecutionTask | any): string[] {
    if (task.ownedFiles && Array.isArray(task.ownedFiles) && task.ownedFiles.length > 0) {
      return task.ownedFiles;
    }

    const title = (task.title || "").toLowerCase();
    const desc = (task.description || "").toLowerCase();
    const stage = String(task.stage || "").toLowerCase();

    const owned: string[] = [];

    if (stage === "database" || stage === "datamodeling" || title.includes("database") || title.includes("prisma") || title.includes("schema")) {
      owned.push("prisma/schema.prisma", "server/lib/prisma.ts", "server/db/index.ts");
    } else if (title.includes("auth") || title.includes("login") || title.includes("jwt")) {
      owned.push("server/routes/auth.routes.ts", "server/controllers/auth.controller.ts", "server/middleware/auth.middleware.ts", "src/lib/auth.ts", "src/features/auth/LoginPage.tsx");
    } else if (stage === "backend" || stage === "apidesign" || title.includes("backend") || title.includes("api") || title.includes("controller")) {
      owned.push("server/routes/*", "server/controllers/*", "server/services/*");
    } else if (stage === "frontend" || title.includes("frontend") || title.includes("ui") || title.includes("component")) {
      if (title.includes("routing") || title.includes("integration") || title.includes("app") || title.includes("page")) {
        owned.push("src/App.tsx", "src/routes.tsx", "src/main.tsx", "src/features/pages/*");
      } else {
        owned.push("src/features/components/*", "src/design-system/*", "src/shared/*");
      }
    } else {
      owned.push(`task-owned-scope-${task.id}/*`);
    }

    return owned;
  }

  /** Check if two tasks have write set collisions (overlapping target files) */
  public static hasWriteConflict(taskA: ExecutionTask | any, taskB: ExecutionTask | any): boolean {
    if (taskA.id === taskB.id) return true;

    const filesA = DependencyScheduler.getOwnedFiles(taskA);
    const filesB = DependencyScheduler.getOwnedFiles(taskB);

    for (const fa of filesA) {
      for (const fb of filesB) {
        if (fa === fb) return true;

        // Shared critical singleton files cannot be concurrently written
        if (
          (fa.includes("schema.prisma") && fb.includes("schema.prisma")) ||
          (fa.includes("App.tsx") && fb.includes("App.tsx")) ||
          (fa.includes("routes.tsx") && fb.includes("routes.tsx")) ||
          (fa.includes("package.json") && fb.includes("package.json")) ||
          (fa.includes("types/index.ts") && fb.includes("types/index.ts"))
        ) {
          return true;
        }

        // Wildcard collision check
        if (fa.endsWith("/*") && fb.startsWith(fa.slice(0, -1))) return true;
        if (fb.endsWith("/*") && fa.startsWith(fb.slice(0, -1))) return true;
        if (fa.endsWith("/*") && fb.endsWith("/*") && fa === fb) return true;
      }
    }

    return false;
  }

  schedule(
    tasks: ExecutionTask[],
  ): ExecutionTask[] {
    const sanitized = DependencyScheduler.sanitizeDependencies(tasks);
    const scheduled: ExecutionTask[] = [];
    const completed = new Set<number>();

    while (scheduled.length < sanitized.length) {
      const ready = sanitized.filter(
        (task) =>
          !completed.has(task.id) &&
          (task.dependencies ?? []).every((dependency) => completed.has(dependency))
      );

      ready.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

      if (ready.length === 0) {
        const remaining = sanitized.filter(t => !completed.has(t.id));
        const cycleDetails = remaining.map(t => `Task ${t.id} ("${t.title}") depends on [${(t.dependencies || []).join(", ")}]`).join(" -> ");
        console.error(`[DependencyScheduler] ❌ TASK GRAPH VALIDATION FAILED — Circular dependency detected:\n  ${cycleDetails}`);
        throw new Error(`TASK_GRAPH_FAILURE: Circular dependency detected in task plan: ${cycleDetails}`);
      }

      for (const task of ready) {
        scheduled.push(task);
        completed.add(task.id);
      }
    }

    return scheduled;
  }

  scheduleParallelTiers(
    tasks: ExecutionTask[],
    options?: SchedulingOptions,
  ): ExecutionTask[][] {
    const maxConcurrency = options?.maxConcurrency ?? DependencyScheduler.DEFAULT_MAX_CONCURRENCY;
    const shouldOptimize = options?.autoOptimize !== false;

    const prepared = shouldOptimize
      ? DependencyScheduler.optimizeTaskDependencies(tasks)
      : DependencyScheduler.sanitizeDependencies(tasks);

    const tiers: ExecutionTask[][] = [];
    const completed = new Set<number>();

    while (completed.size < prepared.length) {
      const ready = prepared.filter(
        (task) =>
          !completed.has(task.id) &&
          (task.dependencies ?? []).every((dependency) => completed.has(dependency))
      );

      if (ready.length === 0) {
        const remaining = prepared.filter(t => !completed.has(t.id));
        const cycleDetails = remaining.map(t => `Task ${t.id} ("${t.title}") depends on [${(t.dependencies || []).join(", ")}]`).join(" -> ");
        console.error(`[DependencyScheduler] ❌ TASK GRAPH VALIDATION FAILED — Circular dependency detected:\n  ${cycleDetails}`);
        throw new Error(`TASK_GRAPH_FAILURE: Circular dependency detected in task plan: ${cycleDetails}`);
      }

      ready.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

      // Pack non-conflicting tasks into a single parallel batch up to maxConcurrency
      const batch: ExecutionTask[] = [];
      for (const candidate of ready) {
        if (batch.length >= maxConcurrency) break;

        const hasConflictWithBatch = batch.some(inBatch => DependencyScheduler.hasWriteConflict(candidate, inBatch));
        if (!hasConflictWithBatch) {
          batch.push(candidate);
        }
      }

      // If all ready tasks conflict with each other, pick at least the top-priority ready task
      if (batch.length === 0 && ready.length > 0) {
        batch.push(ready[0]);
      }

      tiers.push(batch);
      for (const task of batch) {
        completed.add(task.id);
      }
    }

    return tiers;
  }
}

