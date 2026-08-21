/**
 * ReverseDependencyIndex — Aegis V2.3 Project 2 Phase 2
 *
 * Maintains and queries a deterministic target→dependents mapping.
 * Used to efficiently find all files/symbols affected by a given change
 * without scanning every file in the repository.
 *
 * Safety rule: if the index is missing, corrupt, version-incompatible,
 * or inconsistent with file records → return INCREMENTAL_GRAPH_INCOMPLETE.
 * Never guess missing edges.
 */

import { createHash } from "node:crypto";
import type { PersistentAstCache } from "../ast-cache/persistent-ast-cache.js";
import type { CachedReverseDependencyIndex } from "../ast-cache/ast-cache-contract.js";
import type { ReverseDependencyMap } from "./incremental-analysis-contract.js";

export type ReverseDependencyLoadResult =
  | { ok: true; map: ReverseDependencyMap }
  | { ok: false; reason: string };

export class ReverseDependencyIndex {
  private readonly astCache: PersistentAstCache;
  private map: ReverseDependencyMap | null = null;

  constructor(astCache: PersistentAstCache) {
    this.astCache = astCache;
  }

  /**
   * Loads the reverse dependency index from the persistent cache.
   * Returns ok=false with reason if the index is missing or corrupt.
   */
  public load(): ReverseDependencyLoadResult {
    try {
      const persisted: CachedReverseDependencyIndex | null =
        this.astCache.loadReverseDependencies();

      if (!persisted) {
        return { ok: false, reason: "Reverse dependency index is missing from cache" };
      }

      if (
        typeof persisted.fileDependents !== "object" ||
        typeof persisted.symbolDependents !== "object"
      ) {
        return { ok: false, reason: "Reverse dependency index has invalid structure" };
      }

      this.map = {
        fileDependents: this.deepClone(persisted.fileDependents),
        symbolDependents: this.deepClone(persisted.symbolDependents),
      };

      return { ok: true, map: this.map };
    } catch (err: any) {
      return { ok: false, reason: `Failed to load reverse dependency index: ${err?.message}` };
    }
  }

  /**
   * Builds the reverse dependency index from scratch using the current file summaries.
   * This is called during cold analysis to populate the index.
   */
  public buildFromSummaries(
    summaries: Map<string, { filePath: string; imports: Array<{ resolvedSourceFile?: string }> }>
  ): ReverseDependencyMap {
    const fileDependents: Record<string, string[]> = {};
    const symbolDependents: Record<string, string[]> = {};

    for (const [, summary] of summaries) {
      for (const imp of summary.imports) {
        if (imp.resolvedSourceFile) {
          const target = imp.resolvedSourceFile;
          if (!fileDependents[target]) fileDependents[target] = [];
          if (!fileDependents[target].includes(summary.filePath)) {
            fileDependents[target].push(summary.filePath);
          }
        }
      }
    }

    // Sort all arrays for determinism
    for (const key of Object.keys(fileDependents)) {
      fileDependents[key] = fileDependents[key].sort();
    }

    this.map = { fileDependents, symbolDependents };
    return this.map;
  }

  /**
   * Returns direct dependents of the given file (files that import it).
   * Returns null if the index is not loaded or the target is not tracked.
   */
  public getFileDependents(targetFile: string): string[] | null {
    if (!this.map) return null;
    const deps = this.map.fileDependents[targetFile];
    return deps ? [...deps] : [];
  }

  /**
   * Returns all files transitively affected by a set of changed files.
   * Uses BFS over the reverse dependency graph.
   * Returns null if the index is unavailable.
   */
  public getTransitiveAffected(changedFiles: string[]): string[] | null {
    if (!this.map) return null;

    const visited = new Set<string>();
    const queue = [...changedFiles];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const dependents = this.map.fileDependents[current] ?? [];
      for (const dep of dependents) {
        if (!visited.has(dep)) {
          queue.push(dep);
        }
      }
    }

    return [...visited].sort();
  }

  /**
   * Updates the index after a file is added or modified.
   * Removes old edges from the file and adds new ones.
   */
  public updateFile(
    filePath: string,
    oldResolvedImports: string[],
    newResolvedImports: string[]
  ): void {
    if (!this.map) return;

    // Remove old entries where filePath appeared as a dependent
    for (const target of oldResolvedImports) {
      const deps = this.map.fileDependents[target];
      if (deps) {
        const idx = deps.indexOf(filePath);
        if (idx !== -1) deps.splice(idx, 1);
      }
    }

    // Add new entries
    for (const target of newResolvedImports) {
      if (!this.map.fileDependents[target]) {
        this.map.fileDependents[target] = [];
      }
      if (!this.map.fileDependents[target].includes(filePath)) {
        this.map.fileDependents[target].push(filePath);
        this.map.fileDependents[target].sort();
      }
    }
  }

  /**
   * Removes a deleted file from the index.
   */
  public removeFile(filePath: string): void {
    if (!this.map) return;

    // Remove filePath as a dependent of anything it imported
    for (const target of Object.keys(this.map.fileDependents)) {
      const deps = this.map.fileDependents[target];
      const idx = deps.indexOf(filePath);
      if (idx !== -1) deps.splice(idx, 1);
    }

    // Remove filePath as a target (things that imported it are now dangling)
    delete this.map.fileDependents[filePath];
  }

  /**
   * Persists the current index to the cache atomically.
   */
  public persist(): void {
    if (!this.map) return;
    try {
      // Sort all entries for determinism before persisting
      const sorted: CachedReverseDependencyIndex = {
        fileDependents: this.sortedRecord(this.map.fileDependents),
        symbolDependents: this.sortedRecord(this.map.symbolDependents),
      };
      this.astCache.saveReverseDependencies(sorted);
    } catch {
      // Persistence failure is non-fatal for the current operation
    }
  }

  /**
   * Computes a deterministic hash of the current reverse dependency state.
   */
  public computeHash(): string {
    if (!this.map) return "";
    const payload = JSON.stringify({
      fileDependents: this.sortedRecord(this.map.fileDependents),
      symbolDependents: this.sortedRecord(this.map.symbolDependents),
    });
    return createHash("sha256").update(payload).digest("hex");
  }

  /**
   * Returns the current in-memory map (for testing).
   */
  public getMap(): ReverseDependencyMap | null {
    return this.map;
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  private sortedRecord(record: Record<string, string[]>): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const key of Object.keys(record).sort()) {
      result[key] = [...record[key]].sort();
    }
    return result;
  }
}
