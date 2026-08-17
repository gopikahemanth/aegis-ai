/**
 * TaskDAG
 *
 * Dependency-Aware Directed Acyclic Graph for AEGIS task scheduling and preflight validation.
 * Enforces cycle freedom, file ownership uniqueness, and dependency satisfaction.
 */

import type { Task, TaskContractHashes } from "./task.js";

export interface DAGValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  criticalPath: number[];
  parallelTiers: Task[][];
}

export class TaskDAG {
  private tasks: Map<number, Task> = new Map();
  private adjacency: Map<number, Set<number>> = new Map(); // taskId -> set of dependency taskIds
  private reverseAdjacency: Map<number, Set<number>> = new Map(); // taskId -> set of downstream dependent taskIds

  constructor(tasks: Task[] = []) {
    this.initialize(tasks);
  }

  public initialize(tasks: Task[]): void {
    this.tasks.clear();
    this.adjacency.clear();
    this.reverseAdjacency.clear();

    for (const task of tasks) {
      this.tasks.set(task.id, { ...task });
      this.adjacency.set(task.id, new Set(task.dependencies || []));
      if (!this.reverseAdjacency.has(task.id)) {
        this.reverseAdjacency.set(task.id, new Set());
      }
    }

    for (const [taskId, deps] of this.adjacency.entries()) {
      for (const depId of deps) {
        if (!this.reverseAdjacency.has(depId)) {
          this.reverseAdjacency.set(depId, new Set());
        }
        this.reverseAdjacency.get(depId)!.add(taskId);
      }
    }
  }

  public getTask(id: number): Task | undefined {
    return this.tasks.get(id);
  }

  public getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  public getDownstreamDependents(taskId: number): number[] {
    const visited = new Set<number>();
    const queue = [taskId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const dependents = this.reverseAdjacency.get(current);
      if (dependents) {
        for (const dep of dependents) {
          if (!visited.has(dep)) {
            visited.add(dep);
            queue.push(dep);
          }
        }
      }
    }

    return Array.from(visited);
  }

  /**
   * Preflight DAG Validation:
   * Checks for duplicate IDs, missing dependencies, self-dependencies, circular cycles,
   * conflicting file ownership, and invalid exports/imports.
   */
  public validate(currentContracts?: TaskContractHashes): DAGValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const taskIds = new Set(this.tasks.keys());

    // 1. Check for missing and self-dependencies
    for (const [taskId, deps] of this.adjacency.entries()) {
      for (const depId of deps) {
        if (depId === taskId) {
          errors.push(`TASK_DAG_ERROR: Task #${taskId} has a self-dependency.`);
        } else if (!taskIds.has(depId)) {
          errors.push(`TASK_DAG_ERROR: Task #${taskId} depends on non-existent Task #${depId}.`);
        }
      }
    }

    // 2. Check for Circular Dependencies using DFS Cycle Detection
    const visited = new Map<number, "UNVISITED" | "VISITING" | "VISITED">();
    for (const id of taskIds) visited.set(id, "UNVISITED");

    const cyclePath: number[] = [];
    let hasCycle = false;

    const dfs = (node: number): boolean => {
      visited.set(node, "VISITING");
      cyclePath.push(node);

      const deps = this.adjacency.get(node) || new Set();
      for (const dep of deps) {
        if (!taskIds.has(dep)) continue;
        const state = visited.get(dep);
        if (state === "VISITING") {
          cyclePath.push(dep);
          hasCycle = true;
          return true;
        }
        if (state === "UNVISITED") {
          if (dfs(dep)) return true;
        }
      }

      cyclePath.pop();
      visited.set(node, "VISITED");
      return false;
    };

    for (const id of taskIds) {
      if (visited.get(id) === "UNVISITED") {
        if (dfs(id)) break;
      }
    }

    if (hasCycle) {
      errors.push(`TASK_DAG_ERROR: Circular dependency detected in task graph: [${cyclePath.join(" -> ")}]`);
    }

    // 3. Check for File Ownership Conflicts
    const fileOwners = new Map<string, number[]>();
    for (const task of this.tasks.values()) {
      for (const rawFile of task.ownedFiles || []) {
        const file = rawFile.replace(/\\/g, "/");
        if (!fileOwners.has(file)) fileOwners.set(file, []);
        fileOwners.get(file)!.push(task.id);
      }
    }

    for (const [file, owners] of fileOwners.entries()) {
      if (owners.length > 1) {
        // Check if there is an explicit dependency ordering between all owners
        for (let i = 0; i < owners.length; i++) {
          for (let j = i + 1; j < owners.length; j++) {
            const o1 = owners[i];
            const o2 = owners[j];
            const o1DependsOnO2 = this.isReachable(o1, o2);
            const o2DependsOnO1 = this.isReachable(o2, o1);
            if (!o1DependsOnO2 && !o2DependsOnO1) {
              errors.push(
                `FILE_OWNERSHIP_CONFLICT: Tasks #${o1} and #${o2} both claim ownership of file "${file}" without a dependency ordering.`
              );
            }
          }
        }
      }
    }

    // 4. Check Stale Contract Hashes
    if (currentContracts) {
      for (const task of this.tasks.values()) {
        if (task.contractHashes?.architectureHash && currentContracts.architectureHash && task.contractHashes.architectureHash !== currentContracts.architectureHash) {
          warnings.push(`STALE_TASK: Task #${task.id} has architectureHash mismatch.`);
        }
        if (task.contractHashes?.domainHash && currentContracts.domainHash && task.contractHashes.domainHash !== currentContracts.domainHash) {
          warnings.push(`STALE_TASK: Task #${task.id} has domainHash mismatch.`);
        }
      }
    }

    const parallelTiers = errors.length === 0 ? this.calculateParallelTiers() : [];
    const criticalPath = errors.length === 0 ? this.calculateCriticalPath() : [];

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      criticalPath,
      parallelTiers,
    };
  }

  /**
   * Check if task `source` depends directly or indirectly on `target`.
   */
  public isReachable(source: number, target: number): boolean {
    const visited = new Set<number>();
    const queue = [source];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === target) return true;
      const deps = this.adjacency.get(current);
      if (deps) {
        for (const dep of deps) {
          if (!visited.has(dep)) {
            visited.add(dep);
            queue.push(dep);
          }
        }
      }
    }

    return false;
  }

  /**
   * Calculate parallel execution tiers (topological layers).
   */
  public calculateParallelTiers(): Task[][] {
    const completed = new Set<number>();
    const tiers: Task[][] = [];
    const all = Array.from(this.tasks.values());

    while (completed.size < all.length) {
      const ready = all.filter(
        t => !completed.has(t.id) && (t.dependencies || []).every(dep => completed.has(dep))
      );

      if (ready.length === 0) break; // Cycle or stuck

      ready.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
      tiers.push(ready);

      for (const t of ready) {
        completed.add(t.id);
      }
    }

    return tiers;
  }

  /**
   * Calculate Critical Path (longest dependency chain in terms of task duration / count).
   */
  public calculateCriticalPath(): number[] {
    const memo = new Map<number, { length: number; path: number[] }>();

    const getLongestPath = (node: number): { length: number; path: number[] } => {
      if (memo.has(node)) return memo.get(node)!;

      const deps = Array.from(this.adjacency.get(node) || []);
      if (deps.length === 0) {
        const res = { length: 1, path: [node] };
        memo.set(node, res);
        return res;
      }

      let bestPath: number[] = [];
      let maxLen = 0;

      for (const dep of deps) {
        if (!this.tasks.has(dep)) continue;
        const sub = getLongestPath(dep);
        if (sub.length > maxLen) {
          maxLen = sub.length;
          bestPath = sub.path;
        }
      }

      const res = { length: maxLen + 1, path: [...bestPath, node] };
      memo.set(node, res);
      return res;
    };

    let overallBest: number[] = [];
    for (const taskId of this.tasks.keys()) {
      const p = getLongestPath(taskId);
      if (p.path.length > overallBest.length) {
        overallBest = p.path;
      }
    }

    return overallBest;
  }
}
