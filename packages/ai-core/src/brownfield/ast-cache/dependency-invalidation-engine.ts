/**
 * DependencyInvalidationEngine — Aegis V2.3 Project 2 Phase 2
 *
 * Computes minimal invalidated subgraphs from file change sets:
 * - Differentiates directly affected vs transitively affected dependents
 * - Preserves unaffected subgraphs
 * - Flags unresolvable dynamic imports as IMPACT_ANALYSIS_INCOMPLETE
 */

import type { PersistentAstCache } from "./persistent-ast-cache.js";
import type { IncrementalChangeReport } from "./incremental-change-detector.js";

export interface IncrementalImpactSet {
  changedFiles: string[];
  directlyAffectedFiles: string[];
  transitivelyAffectedFiles: string[];
  invalidatedSymbols: string[];
  invalidatedIndexes: string[];
  requiresFullReindex: boolean;
  blockedReasons: string[];
}

export class DependencyInvalidationEngine {
  private readonly cache: PersistentAstCache;

  constructor(cache: PersistentAstCache) {
    this.cache = cache;
  }

  /**
   * Computes the minimal affected dependency closure for a change report.
   */
  public computeImpact(report: IncrementalChangeReport): IncrementalImpactSet {
    const changedFiles = [...report.added, ...report.modified, ...report.removed];
    const directlyAffected = new Set<string>();
    const transitivelyAffected = new Set<string>();
    const invalidatedSymbols = new Set<string>();
    const blockedReasons: string[] = [];

    const reverseIndex = this.cache.loadReverseDependencies();
    const fileDependents = reverseIndex?.fileDependents || {};

    // 1. Trace direct and transitive dependents
    for (const change of report.changes) {
      if (change.kind === "UNCHANGED") continue;

      const cached = this.cache.getFileRecord(change.filePath);
      if (cached) {
        // Collect invalidated symbol IDs
        cached.symbols.forEach(s => invalidatedSymbols.add(s.id));

        // Check for unresolved dynamic imports
        if (cached.unresolvedDynamicImports && cached.unresolvedDynamicImports.length > 0) {
          blockedReasons.push(
            `IMPACT_ANALYSIS_INCOMPLETE: File "${change.filePath}" contains unresolved dynamic imports: ${cached.unresolvedDynamicImports.join(", ")}`
          );
        }
      }

      // Query reverse dependencies
      const direct = fileDependents[change.filePath] || [];
      for (const dep of direct) {
        directlyAffected.add(dep);
        this.expandTransitive(dep, fileDependents, transitivelyAffected, new Set([change.filePath]));
      }
    }

    return {
      changedFiles,
      directlyAffectedFiles: [...directlyAffected].sort(),
      transitivelyAffectedFiles: [...transitivelyAffected].sort(),
      invalidatedSymbols: [...invalidatedSymbols].sort(),
      invalidatedIndexes: ["symbol-table.json", "reverse-deps.json"],
      requiresFullReindex: blockedReasons.length > 0,
      blockedReasons,
    };
  }

  private expandTransitive(
    current: string,
    fileDependents: Record<string, string[]>,
    visited: Set<string>,
    cycleGuard: Set<string>
  ) {
    if (cycleGuard.has(current)) return;
    cycleGuard.add(current);

    const nextDeps = fileDependents[current] || [];
    for (const next of nextDeps) {
      if (!visited.has(next)) {
        visited.add(next);
        this.expandTransitive(next, fileDependents, visited, cycleGuard);
      }
    }
  }
}
