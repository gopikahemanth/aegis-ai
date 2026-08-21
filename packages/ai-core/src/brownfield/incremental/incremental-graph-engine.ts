/**
 * IncrementalGraphEngine — Aegis V2.3 Project 2 Phase 2
 *
 * Orchestrates incremental AST/dependency graph updates.
 * Detects changes, builds a GraphDelta, updates the in-memory graph,
 * updates the ReverseDependencyIndex, and persists atomically.
 *
 * Safety invariant: INCREMENTAL ANALYSIS == FULL COLD ANALYSIS
 * If correctness cannot be established → INCREMENTAL_GRAPH_INCOMPLETE
 * → discard incremental result → perform safe full cold analysis.
 *
 * The cache NEVER becomes a source of truth for execution integrity.
 * planHash and patchHash remain tied to actual disk preimages.
 */

import { createHash } from "node:crypto";
import { join } from "node:path";
import type { SymbolReferenceResolver, FileAstSummary } from "../symbol-reference-resolver.js";
import type { PersistentAstCache } from "../ast-cache/persistent-ast-cache.js";
import { ChangedFileDetector } from "./changed-file-detector.js";
import { GraphDeltaBuilder } from "./graph-delta-builder.js";
import { ReverseDependencyIndex } from "./reverse-dependency-index.js";
import type {
  FileChangeRecord,
  GraphDelta,
  GraphSnapshot,
  IncrementalAnalysisResult,
  IncrementalSafetyStatus,
} from "./incremental-analysis-contract.js";

export interface IncrementalAnalysisOptions {
  /** Skip writing to disk cache after analysis (for testing) */
  dryRun?: boolean;
  /** Force full cold analysis regardless of cache state */
  forceFullAnalysis?: boolean;
}

export class IncrementalGraphEngine {
  private readonly projectRoot: string;
  private readonly symbolResolver: SymbolReferenceResolver;
  private readonly astCache: PersistentAstCache;
  private readonly detector: ChangedFileDetector;
  private readonly deltaBuilder: GraphDeltaBuilder;
  private readonly reverseDepsIndex: ReverseDependencyIndex;

  constructor(projectRoot: string, symbolResolver: SymbolReferenceResolver) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
    this.symbolResolver = symbolResolver;
    this.astCache = symbolResolver.getAstCache();
    this.detector = new ChangedFileDetector(this.projectRoot, this.astCache);
    this.deltaBuilder = new GraphDeltaBuilder(this.projectRoot, this.astCache, symbolResolver);
    this.reverseDepsIndex = new ReverseDependencyIndex(this.astCache);
  }

  /**
   * Performs incremental analysis if safe, otherwise falls back to full cold analysis.
   *
   * Flow:
   *   1. Detect changes (disk vs cache)
   *   2. If any UNKNOWN → full cold analysis
   *   3. Build GraphDelta
   *   4. If delta status is INCREMENTAL_GRAPH_INCOMPLETE → full cold analysis
   *   5. Update in-memory graph from delta
   *   6. Update ReverseDependencyIndex
   *   7. Persist atomically
   *   8. Compute graphHash
   */
  public async analyzeIncrementally(
    currentFiles: string[],
    options: IncrementalAnalysisOptions = {}
  ): Promise<IncrementalAnalysisResult> {
    const t0 = Date.now();

    if (options.forceFullAnalysis) {
      return this.performFullAnalysis(currentFiles, t0, "Force full analysis requested");
    }

    // ── 1. Ensure cache is initialized ────────────────────────────────────
    this.astCache.init();

    // ── 2. Load persisted cached paths ────────────────────────────────────
    const cachedPaths = this.getCachedFilePaths();
    if (cachedPaths === null) {
      return this.performFullAnalysis(currentFiles, t0, "Cache unavailable");
    }

    // ── 3. Detect changes ─────────────────────────────────────────────────
    const t1 = Date.now();
    const changeRecords = this.detector.detect(currentFiles, cachedPaths);
    const t2 = Date.now();

    // ── 4. UNKNOWN files → full cold analysis ─────────────────────────────
    if (this.detector.requiresFullAnalysis(changeRecords)) {
      return this.performFullAnalysis(
        currentFiles,
        t0,
        `UNKNOWN file status detected: ${changeRecords.filter(r => r.status === "UNKNOWN").map(r => r.filePath).join(", ")}`
      );
    }

    // ── 5. All clean → return lightweight result ──────────────────────────
    if (this.detector.isClean(changeRecords)) {
      const summaries = this.symbolResolver.getAllSummaries();
      const snapshot = this.computeGraphSnapshot(summaries);
      return {
        status: "INCREMENTAL_OK",
        filesParsed: 0,
        filesTotal: currentFiles.length,
        delta: null,
        snapshot,
        fromCache: true,
        timings: {
          detectionMs: t2 - t1,
          deltaMs: 0,
          parseMs: 0,
          graphUpdateMs: 0,
          closureMs: 0,
          totalMs: Date.now() - t0,
        },
      };
    }

    // ── 6. Load reverse dependency index ──────────────────────────────────
    const rdxResult = this.reverseDepsIndex.load();
    if (!rdxResult.ok) {
      return this.performFullAnalysis(currentFiles, t0, rdxResult.reason);
    }

    // ── 7. Build delta ────────────────────────────────────────────────────
    const t3 = Date.now();
    const delta = this.deltaBuilder.build(changeRecords);
    const t4 = Date.now();

    if (delta.status === "INCREMENTAL_GRAPH_INCOMPLETE") {
      return this.performFullAnalysis(
        currentFiles,
        t0,
        delta.reason ?? "GraphDelta status: INCREMENTAL_GRAPH_INCOMPLETE"
      );
    }

    // ── 8. Update in-memory graph ─────────────────────────────────────
    const t5 = Date.now();
    this.applyDeltaToInMemoryGraph(delta);
    // Re-resolve imports for all affected files so graphHash matches a cold scan
    this.reResolveAffectedImports(delta.affectedFiles);
    const t6 = Date.now();

    // ── 9. Update reverse dependency index ───────────────────────────────
    this.updateReverseIndex(delta);

    // ── 10. Persist atomically ────────────────────────────────────────────
    if (!options.dryRun) {
      this.astCache.withLock(() => {
        // Delete removed file records
        for (const deleted of delta.deletedFiles) {
          this.astCache.deleteFileRecord(deleted);
        }

        // Persist updated reverse deps
        this.reverseDepsIndex.persist();

        // Persist updated symbol table
        const allSymbols = this.gatherAllSymbols();
        this.astCache.saveSymbolTable(allSymbols);
      });
    }

    // ── 11. Compute graph snapshot ────────────────────────────────────────
    const summaries = this.symbolResolver.getAllSummaries();
    const snapshot = this.computeGraphSnapshot(summaries);

    const changed = this.detector.getChangedRecords(changeRecords);

    return {
      status: delta.status === "GRAPH_INCOMPLETE" ? "GRAPH_INCOMPLETE" : "INCREMENTAL_OK",
      filesParsed: delta.addedFiles.length + delta.modifiedFiles.length,
      filesTotal: currentFiles.length,
      delta,
      snapshot,
      fromCache: true,
      timings: {
        detectionMs: t2 - t1,
        deltaMs: t4 - t3,
        parseMs: t4 - t3,
        graphUpdateMs: t6 - t5,
        closureMs: 0,
        totalMs: Date.now() - t0,
      },
    };
  }

  /**
   * Computes a deterministic graphHash for the current in-memory graph state.
   * Cold and incremental analysis of the same repository state must produce identical graphHash.
   */
  public computeGraphSnapshot(summaries: Map<string, FileAstSummary>): GraphSnapshot {
    const files: string[] = [];
    const symbols: string[] = [];
    const edges: string[] = [];
    const unresolvedReferences: string[] = [];

    for (const [filePath, summary] of summaries) {
      files.push(filePath);

      for (const sym of summary.symbols) {
        symbols.push(sym.id);
      }

      for (const imp of summary.imports) {
        if (!imp.isDynamic && imp.resolvedSourceFile) {
          edges.push(`${summary.filePath}|${imp.resolvedSourceFile}|${imp.sourceModuleSpecifier}`);
        }
      }

      for (const exp of summary.exports) {
        if (exp.isReExport && exp.resolvedSourceFile) {
          edges.push(`${summary.filePath}|${exp.resolvedSourceFile}|${exp.reExportModuleSpecifier ?? ""}`);
        }
      }

      for (const unresolved of summary.unresolvedDynamicImports) {
        unresolvedReferences.push(`${filePath}|${unresolved}`);
      }
    }

    files.sort();
    symbols.sort();
    edges.sort();
    unresolvedReferences.sort();

    const payload = JSON.stringify({ files, symbols, edges, unresolvedReferences });
    const graphHash = createHash("sha256").update(payload).digest("hex");

    return { graphHash, files, symbols, edges, unresolvedReferences };
  }

  /**
   * Returns the reverse dependency index (for testing and impact analysis).
   */
  public getReverseDependencyIndex(): ReverseDependencyIndex {
    return this.reverseDepsIndex;
  }

  /**
   * Returns all detected changes for the current repository state vs. cache.
   */
  public detectChanges(currentFiles: string[]): FileChangeRecord[] {
    this.astCache.init();
    const cachedPaths = this.getCachedFilePaths() ?? [];
    return this.detector.detect(currentFiles, cachedPaths);
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  private performFullAnalysis(
    currentFiles: string[],
    t0: number,
    fallbackReason: string
  ): IncrementalAnalysisResult {
    const t1 = Date.now();

    // Perform full cold analysis through SymbolReferenceResolver
    const summaries = this.symbolResolver.parseProject({ bypassCache: false });

    // Rebuild reverse dependency index from scratch
    const rdxMap = this.reverseDepsIndex.buildFromSummaries(summaries);
    this.reverseDepsIndex.persist();

    const snapshot = this.computeGraphSnapshot(summaries);
    const t2 = Date.now();

    return {
      status: "INCREMENTAL_GRAPH_INCOMPLETE",
      filesParsed: currentFiles.length,
      filesTotal: currentFiles.length,
      delta: null,
      snapshot,
      fromCache: false,
      timings: {
        detectionMs: 0,
        deltaMs: 0,
        parseMs: t2 - t1,
        graphUpdateMs: 0,
        closureMs: 0,
        totalMs: t2 - t0,
      },
      fallbackReason,
    };
  }

  private applyDeltaToInMemoryGraph(delta: GraphDelta): void {
    const summaries = this.symbolResolver.getAllSummaries();

    // Remove deleted files from in-memory graph
    for (const deletedFile of delta.deletedFiles) {
      summaries.delete(deletedFile);
      this.symbolResolver.evictFromCache(deletedFile);
    }

    // Modified/added files were already freshly parsed by GraphDeltaBuilder.processCreated
    // (which used parseFileFresh, evicting stale data). Summary cache is already updated.
  }

  /**
   * Re-resolves import/export paths for all affected files.
   * Required for graphHash equivalence: the hash is derived from resolvedSourceFile,
   * which may differ between the old in-memory state and the current disk state.
   */
  private reResolveAffectedImports(affectedFiles: string[]): void {
    for (const filePath of affectedFiles) {
      const summary = this.symbolResolver.getAllSummaries().get(filePath);
      if (!summary) continue;
      for (const imp of summary.imports) {
        if (!imp.isDynamic) {
          imp.resolvedSourceFile = this.symbolResolver.resolveModulePath(
            summary.filePath,
            imp.sourceModuleSpecifier
          );
        }
      }
      for (const exp of summary.exports) {
        if (exp.isReExport && exp.reExportModuleSpecifier) {
          exp.resolvedSourceFile = this.symbolResolver.resolveModulePath(
            summary.filePath,
            exp.reExportModuleSpecifier
          );
        }
      }
    }
  }

  private updateReverseIndex(delta: GraphDelta): void {
    // Handle deleted files
    for (const deleted of delta.deletedFiles) {
      this.reverseDepsIndex.removeFile(deleted);
    }

    // Handle modified/created files
    for (const filePath of [...delta.modifiedFiles, ...delta.addedFiles]) {
      const summary = this.symbolResolver.getAllSummaries().get(filePath);
      if (!summary) continue;

      const newImports = summary.imports
        .filter(i => !i.isDynamic && !!i.resolvedSourceFile)
        .map(i => i.resolvedSourceFile!);

      this.reverseDepsIndex.updateFile(filePath, [], newImports);
    }
  }

  private getCachedFilePaths(): string[] | null {
    try {
      const symbolTable = this.astCache.loadSymbolTable();
      if (symbolTable === null) {
        // Try loading from file records via summaries
        const summaries = this.symbolResolver.getAllSummaries();
        if (summaries.size === 0) return null;
        return [...summaries.keys()];
      }

      // Extract unique file paths from symbol table
      const paths = new Set<string>();
      for (const entry of symbolTable) {
        if (entry.filePath) paths.add(entry.filePath);
      }

      return [...paths];
    } catch {
      return null;
    }
  }

  private gatherAllSymbols() {
    const summaries = this.symbolResolver.getAllSummaries();
    const result = [];
    for (const [, summary] of summaries) {
      for (const sym of summary.symbols) {
        result.push({
          symbolId: sym.id,
          filePath: sym.filePath,
          symbolName: sym.name,
          kind: sym.kind,
          isExported: sym.isExported,
          isDefaultExport: sym.isDefaultExport,
          line: sym.line,
          col: sym.col,
        });
      }
    }
    return result;
  }
}
