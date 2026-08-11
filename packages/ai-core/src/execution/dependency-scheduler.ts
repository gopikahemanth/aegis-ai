import type { ExecutionTask } from "./execution-loop.js";

export class DependencyScheduler {
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
  ): ExecutionTask[][] {
    const sanitized = DependencyScheduler.sanitizeDependencies(tasks);
    const tiers: ExecutionTask[][] = [];
    const completed = new Set<number>();

    while (completed.size < sanitized.length) {
      const ready = sanitized.filter(
        (task) =>
          !completed.has(task.id) &&
          (task.dependencies ?? []).every((dependency) => completed.has(dependency))
      );

      if (ready.length === 0) {
        const remaining = sanitized.filter(t => !completed.has(t.id));
        const cycleDetails = remaining.map(t => `Task ${t.id} ("${t.title}") depends on [${(t.dependencies || []).join(", ")}]`).join(" -> ");
        console.error(`[DependencyScheduler] ❌ TASK GRAPH VALIDATION FAILED — Circular dependency detected:\n  ${cycleDetails}`);
        throw new Error(`TASK_GRAPH_FAILURE: Circular dependency detected in task plan: ${cycleDetails}`);
      }

      ready.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

      tiers.push(ready);
      for (const task of ready) {
        completed.add(task.id);
      }
    }

    return tiers;
  }
}

