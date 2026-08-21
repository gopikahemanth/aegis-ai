/**
 * Incremental Analysis Subsystem — Aegis V2.3 Project 2 Phase 2
 */

export { IncrementalGraphEngine } from "./incremental-graph-engine.js";
export type { IncrementalAnalysisOptions } from "./incremental-graph-engine.js";

export { ChangedFileDetector } from "./changed-file-detector.js";
export { GraphDeltaBuilder } from "./graph-delta-builder.js";
export { ReverseDependencyIndex } from "./reverse-dependency-index.js";
export type { ReverseDependencyLoadResult } from "./reverse-dependency-index.js";

export type {
  FileChangeStatus,
  FileChangeRecord,
  IncrementalGraphEdgeKind,
  IncrementalGraphEdge,
  GraphDeltaStatus,
  GraphDelta,
  GraphSnapshot,
  IncrementalSafetyStatus,
  IncrementalAnalysisResult,
  ReverseDependencyMap,
  IncrementalBenchmarkEntry,
} from "./incremental-analysis-contract.js";
