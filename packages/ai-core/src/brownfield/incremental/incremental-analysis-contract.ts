/**
 * Incremental Analysis Contract — Aegis V2.3 Project 2 Phase 2
 *
 * Types, interfaces, and status codes for the incremental AST/dependency graph engine.
 */

import type { CachedSymbolEntry } from "../ast-cache/ast-cache-contract.js";

// ─── File Change Classification ────────────────────────────────────────────────

export type FileChangeStatus =
  | "UNCHANGED"   // Disk matches cache exactly
  | "MODIFIED"    // Content changed
  | "CREATED"     // New file not in cache
  | "DELETED"     // Was in cache, now gone from disk
  | "UNKNOWN";    // Cannot determine (e.g. suspected rename without proof)

export interface FileChangeRecord {
  filePath: string;       // Relative path from project root
  status: FileChangeStatus;
  oldContentHash?: string;
  newContentHash?: string;
  reason?: string;        // Why it's UNKNOWN/etc
}

// ─── Graph Edge ────────────────────────────────────────────────────────────────

export interface IncrementalGraphEdge {
  id: string;               // Deterministic: `${fromFile}|${toFile}|${specifier}`
  fromFile: string;         // Relative importer path
  toFile: string;           // Relative resolved path
  specifier: string;        // Original import specifier
  kind: IncrementalGraphEdgeKind;
  importedNames: string[];  // Named imports or ["*"] or ["default"]
}

export type IncrementalGraphEdgeKind =
  | "STATIC_IMPORT"
  | "STATIC_EXPORT"
  | "RE_EXPORT"
  | "WILDCARD_RE_EXPORT"
  | "DYNAMIC_IMPORT";  // Always unsafe → INCREMENTAL_GRAPH_INCOMPLETE

// ─── Graph Delta ───────────────────────────────────────────────────────────────

export type GraphDeltaStatus =
  | "CLEAN"                       // All changes resolved, graph is complete
  | "INCREMENTAL_GRAPH_INCOMPLETE" // Cannot prove correctness → fall back
  | "GRAPH_INCOMPLETE";            // Deleted node left dangling references

export interface GraphDelta {
  /** Files added to the project */
  addedFiles: string[];
  /** Files whose content changed */
  modifiedFiles: string[];
  /** Files removed from the project */
  deletedFiles: string[];

  /** New symbols in added/modified files */
  addedSymbols: CachedSymbolEntry[];
  /** Symbols no longer present in modified/deleted files */
  removedSymbols: CachedSymbolEntry[];

  /** New graph edges introduced */
  addedEdges: IncrementalGraphEdge[];
  /** Graph edges removed */
  removedEdges: IncrementalGraphEdge[];

  /** All files whose analysis may need updating (direct + transitive dependents) */
  affectedFiles: string[];
  /** Import specifiers that could not be resolved statically */
  unresolvedReferences: string[];

  /** Delta correctness status */
  status: GraphDeltaStatus;
  /** Reason if status != CLEAN */
  reason?: string;

  /** Deterministic hash of this delta */
  deltaHash: string;
}

// ─── Graph Snapshot ────────────────────────────────────────────────────────────

export interface GraphSnapshot {
  /** Canonical hash of the complete graph state */
  graphHash: string;

  /** Sorted file paths in the graph */
  files: string[];

  /** Sorted symbol IDs */
  symbols: string[];

  /** Sorted edge IDs */
  edges: string[];

  /** Sorted unresolved import specifiers */
  unresolvedReferences: string[];
}

// ─── Incremental Analysis Result ───────────────────────────────────────────────

export type IncrementalSafetyStatus =
  | "INCREMENTAL_OK"               // Incremental graph is verified complete
  | "INCREMENTAL_GRAPH_INCOMPLETE" // Fell back to cold analysis
  | "GRAPH_INCOMPLETE"             // Deletion left dangling references
  | "CACHE_UNAVAILABLE";           // Cache missing/corrupt, using cold

export interface IncrementalAnalysisResult {
  status: IncrementalSafetyStatus;

  /** Number of files actually re-parsed (0 if all cache hits) */
  filesParsed: number;
  /** Total files in project */
  filesTotal: number;

  /** Delta that was applied (null if fell back to cold) */
  delta: GraphDelta | null;

  /** Graph snapshot after analysis */
  snapshot: GraphSnapshot;

  /** Whether this result was from incremental or cold analysis */
  fromCache: boolean;

  /** Performance timings in ms */
  timings: {
    detectionMs: number;
    deltaMs: number;
    parseMs: number;
    graphUpdateMs: number;
    closureMs: number;
    totalMs: number;
  };

  /** Fall-back reason if incremental was not used */
  fallbackReason?: string;
}

// ─── Reverse Dependency Index ──────────────────────────────────────────────────

export interface ReverseDependencyMap {
  /** target relative file -> set of importer relative files */
  fileDependents: Record<string, string[]>;
  /** target symbol ID -> set of referencing symbol IDs */
  symbolDependents: Record<string, string[]>;
}

// ─── Performance Benchmark Entry ───────────────────────────────────────────────

export interface IncrementalBenchmarkEntry {
  scenario: string;
  totalFiles: number;
  changedFiles: number;
  fullScanMs: number;
  incrementalScanMs: number;
  filesParsedFull: number;
  filesParsedIncremental: number;
  graphUpdateMs: number;
  closureMs: number;
  totalMs: number;
  graphHashMatch: boolean;
}
