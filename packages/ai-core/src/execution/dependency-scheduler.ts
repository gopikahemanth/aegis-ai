import type { ExecutionTask } from "./execution-loop.js";

export class DependencyScheduler {
  schedule(
    tasks: ExecutionTask[],
  ): ExecutionTask[] {

    const scheduled: ExecutionTask[] = [];
    const completed = new Set<number>();

    while (
      scheduled.length < tasks.length
    ) {

      const ready =
        tasks.filter(
          (task) =>
            !completed.has(task.id) &&
            (
              task.dependencies ??
              []
            ).every(
              (dependency) =>
                completed.has(
                  dependency,
                ),
            ),
        );

      ready.sort(
        (a, b) =>
          (a.priority ?? 999) -
          (b.priority ?? 999),
      );

      if (
        ready.length === 0
      ) {
        throw new Error(
          "Circular task dependency detected.",
        );
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
    const tiers: ExecutionTask[][] = [];
    const completed = new Set<number>();

    while (
      completed.size < tasks.length
    ) {
      const ready =
        tasks.filter(
          (task) =>
            !completed.has(task.id) &&
            (
              task.dependencies ??
              []
            ).every(
              (dependency) =>
                completed.has(
                  dependency,
                ),
            ),
        );

      if (
        ready.length === 0
      ) {
        throw new Error(
          "Circular task dependency detected.",
        );
      }

      ready.sort(
        (a, b) =>
          (a.priority ?? 999) -
          (b.priority ?? 999),
      );

      tiers.push(ready);
      for (const task of ready) {
        completed.add(task.id);
      }
    }

    return tiers;
  }
}
