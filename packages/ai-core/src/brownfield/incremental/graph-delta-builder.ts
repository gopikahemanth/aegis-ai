/**
 * GraphDeltaBuilder — Aegis V2.3 Project 2 Phase 2
 *
 * Builds a deterministic GraphDelta from a set of FileChangeRecords.
 * Re-parses MODIFIED and CREATED files, removes DELETED records,
 * updates symbol tables and import/export edges.
 *
 * Safety rules:
 * - Dynamic imports always → INCREMENTAL_GRAPH_INCOMPLETE
 * - Unresolvable imports → tracked in unresolvedReferences
 * - All output arrays are sorted for determinism
 * - Never manufactures an edge
 */

import { createHash } from "node:crypto";
import { existsSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import type { PersistentAstCache } from "../ast-cache/persistent-ast-cache.js";
import { AstCacheHash } from "../ast-cache/ast-cache-hash.js";
import type {
  CachedFileRecord,
  CachedSymbolEntry,
} from "../ast-cache/ast-cache-contract.js";
import type { SymbolReferenceResolver } from "../symbol-reference-resolver.js";
import type {
  FileChangeRecord,
  GraphDelta,
  IncrementalGraphEdge,
  GraphDeltaStatus,
} from "./incremental-analysis-contract.js";

export class GraphDeltaBuilder {
  private readonly projectRoot: string;
  private readonly astCache: PersistentAstCache;
  private readonly symbolResolver: SymbolReferenceResolver;

  constructor(
    projectRoot: string,
    astCache: PersistentAstCache,
    symbolResolver: SymbolReferenceResolver
  ) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
    this.astCache = astCache;
    this.symbolResolver = symbolResolver;
  }

  /**
   * Builds a deterministic GraphDelta from a list of file change records.
   */
  public build(changes: FileChangeRecord[]): GraphDelta {
    const addedFiles: string[] = [];
    const modifiedFiles: string[] = [];
    const deletedFiles: string[] = [];
    const addedSymbols: CachedSymbolEntry[] = [];
    const removedSymbols: CachedSymbolEntry[] = [];
    const addedEdges: IncrementalGraphEdge[] = [];
    const removedEdges: IncrementalGraphEdge[] = [];
    const unresolvedReferences: string[] = [];

    let status: GraphDeltaStatus = "CLEAN";
    let reason: string | undefined;

    // ── UNKNOWN → immediate incomplete ─────────────────────────────────────
    const unknownFiles = changes.filter(c => c.status === "UNKNOWN");
    if (unknownFiles.length > 0) {
      status = "INCREMENTAL_GRAPH_INCOMPLETE";
      reason = `UNKNOWN file status for: ${unknownFiles.map(f => f.filePath).join(", ")}`;
    }

    // ── Process each change ─────────────────────────────────────────────────
    for (const change of changes) {
      switch (change.status) {
        case "CREATED": {
          const result = this.processCreated(change.filePath);
          addedFiles.push(change.filePath);
          addedSymbols.push(...result.symbols);
          addedEdges.push(...result.edges);
          unresolvedReferences.push(...result.unresolved);
          if (result.hasDynamicImports) {
            status = "INCREMENTAL_GRAPH_INCOMPLETE";
            reason = reason ?? `Dynamic import in created file: ${change.filePath}`;
          }
          break;
        }

        case "MODIFIED": {
          // Remove old edges/symbols from cache record
          const oldRecord = this.astCache.getFileRecord(change.filePath);
          if (oldRecord) {
            removedSymbols.push(...this.toSymbolEntries(oldRecord));
            removedEdges.push(...this.toGraphEdges(oldRecord));
          }

          // Parse fresh
          const result = this.processCreated(change.filePath);
          modifiedFiles.push(change.filePath);
          addedSymbols.push(...result.symbols);
          addedEdges.push(...result.edges);
          unresolvedReferences.push(...result.unresolved);
          if (result.hasDynamicImports) {
            status = "INCREMENTAL_GRAPH_INCOMPLETE";
            reason = reason ?? `Dynamic import in modified file: ${change.filePath}`;
          }
          break;
        }

        case "DELETED": {
          const oldRecord = this.astCache.getFileRecord(change.filePath);
          if (oldRecord) {
            removedSymbols.push(...this.toSymbolEntries(oldRecord));
            removedEdges.push(...this.toGraphEdges(oldRecord));
          }
          deletedFiles.push(change.filePath);

          // Deletion may leave dangling references — mark as incomplete
          if (status === "CLEAN") {
            status = "GRAPH_INCOMPLETE";
            reason = `Deleted file may have left dangling references: ${change.filePath}`;
          }
          break;
        }

        case "UNKNOWN": {
          // Already handled above
          break;
        }

        case "UNCHANGED":
          // No delta contribution
          break;
      }
    }

    // ── Sort all arrays for determinism ─────────────────────────────────────
    addedFiles.sort();
    modifiedFiles.sort();
    deletedFiles.sort();
    addedSymbols.sort((a, b) => a.symbolId.localeCompare(b.symbolId));
    removedSymbols.sort((a, b) => a.symbolId.localeCompare(b.symbolId));
    addedEdges.sort((a, b) => a.id.localeCompare(b.id));
    removedEdges.sort((a, b) => a.id.localeCompare(b.id));
    unresolvedReferences.sort();

    // Compute affected files = all files that may need re-analysis
    const affectedFiles = this.computeAffectedFiles(
      [...addedFiles, ...modifiedFiles, ...deletedFiles],
      removedEdges
    );

    const delta: Omit<GraphDelta, "deltaHash"> = {
      addedFiles,
      modifiedFiles,
      deletedFiles,
      addedSymbols,
      removedSymbols,
      addedEdges,
      removedEdges,
      affectedFiles,
      unresolvedReferences,
      status,
      reason,
    };

    const deltaHash = this.computeDeltaHash(delta);

    return { ...delta, deltaHash };
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  private processCreated(relPath: string): {
    symbols: CachedSymbolEntry[];
    edges: IncrementalGraphEdge[];
    unresolved: string[];
    hasDynamicImports: boolean;
    record: CachedFileRecord | null;
  } {
    const fullPath = join(this.projectRoot, relPath);
    if (!existsSync(fullPath)) {
      return { symbols: [], edges: [], unresolved: [], hasDynamicImports: false, record: null };
    }

    try {
      // Use parseFileFresh to bypass stale summary cache entries for modified/created files
      const summary = this.symbolResolver.parseFileFresh(relPath);
      if (!summary) {
        return { symbols: [], edges: [], unresolved: [], hasDynamicImports: false, record: null };
      }

      const hasDynamicImports = summary.unresolvedDynamicImports.length > 0 ||
        summary.imports.some(imp => imp.isDynamic);

      const symbols: CachedSymbolEntry[] = summary.symbols.map(sym => ({
        symbolId: sym.id,
        filePath: sym.filePath,
        symbolName: sym.name,
        kind: sym.kind,
        isExported: sym.isExported,
        isDefaultExport: sym.isDefaultExport,
        line: sym.line,
        col: sym.col,
      }));

      const addedEdges: IncrementalGraphEdge[] = [];
      for (const imp of summary.imports) {
        if (imp.isDynamic) continue; // Dynamic → safety boundary

        const edgeId = `${relPath}|${imp.resolvedSourceFile ?? imp.sourceModuleSpecifier}|${imp.sourceModuleSpecifier}`;
        if (imp.resolvedSourceFile) {
        addedEdges.push({
            id: edgeId,
            fromFile: relPath,
            toFile: imp.resolvedSourceFile,
            specifier: imp.sourceModuleSpecifier,
            kind: "STATIC_IMPORT",
            importedNames: imp.importedName === "*"
              ? ["*"]
              : imp.importedName === "default"
              ? ["default"]
              : [imp.importedName],
          });
        }
      }

      for (const exp of summary.exports) {
        if (exp.isReExport && exp.resolvedSourceFile) {
          const edgeId = `${relPath}|${exp.resolvedSourceFile}|${exp.reExportModuleSpecifier ?? ""}`;
          addedEdges.push({
            id: edgeId,
            fromFile: relPath,
            toFile: exp.resolvedSourceFile,
            specifier: exp.reExportModuleSpecifier ?? "",
            kind: exp.isWildcard ? "WILDCARD_RE_EXPORT" : "RE_EXPORT",
            importedNames: exp.isWildcard ? ["*"] : [exp.exportedName],
          });
        }
      }

      const unresolved = [
        ...summary.unresolvedDynamicImports,
        ...summary.imports.filter(i => !i.resolvedSourceFile && !i.isDynamic).map(i => i.sourceModuleSpecifier),
      ].filter((v, i, arr) => arr.indexOf(v) === i);

      // Persist updated record
      try {
        const stat = statSync(fullPath);
        const contentHash = AstCacheHash.computeFileHash(fullPath);
        this.astCache.setFileRecord({
          filePath: relPath,
          contentHash,
          mtimeMs: stat.mtimeMs,
          sizeBytes: stat.size,
          symbols: summary.symbols,
          imports: summary.imports,
          exports: summary.exports,
          unresolvedDynamicImports: summary.unresolvedDynamicImports,
          callGraphEdges: [],
        });
      } catch {
        // Persistence failure is non-fatal
      }

      return { symbols, edges: addedEdges, unresolved, hasDynamicImports, record: null };
    } catch {
      return { symbols: [], edges: [], unresolved: [relPath], hasDynamicImports: false, record: null };
    }
  }

  private toSymbolEntries(record: CachedFileRecord): CachedSymbolEntry[] {
    return record.symbols.map(sym => ({
      symbolId: sym.id,
      filePath: sym.filePath,
      symbolName: sym.name,
      kind: sym.kind,
      isExported: sym.isExported,
      isDefaultExport: sym.isDefaultExport,
      line: sym.line,
      col: sym.col,
    }));
  }

  private toGraphEdges(record: CachedFileRecord): IncrementalGraphEdge[] {
    const edges: IncrementalGraphEdge[] = [];
    for (const imp of record.imports) {
      if (imp.isDynamic || !imp.resolvedSourceFile) continue;
      edges.push({
        id: `${record.filePath}|${imp.resolvedSourceFile}|${imp.sourceModuleSpecifier}`,
        fromFile: record.filePath,
        toFile: imp.resolvedSourceFile,
        specifier: imp.sourceModuleSpecifier,
        kind: "STATIC_IMPORT",
        importedNames: [imp.importedName],
      });
    }
    for (const exp of record.exports) {
      if (exp.isReExport && exp.resolvedSourceFile) {
        edges.push({
          id: `${record.filePath}|${exp.resolvedSourceFile}|${exp.reExportModuleSpecifier ?? ""}`,
          fromFile: record.filePath,
          toFile: exp.resolvedSourceFile,
          specifier: exp.reExportModuleSpecifier ?? "",
          kind: exp.isWildcard ? "WILDCARD_RE_EXPORT" : "RE_EXPORT",
          importedNames: exp.isWildcard ? ["*"] : [exp.exportedName],
        });
      }
    }
    return edges;
  }

  private computeAffectedFiles(primaryChanged: string[], removedEdges: IncrementalGraphEdge[]): string[] {
    const affected = new Set<string>(primaryChanged);

    // Files that depended on removed edges are also affected
    for (const edge of removedEdges) {
      affected.add(edge.fromFile);
      affected.add(edge.toFile);
    }

    return [...affected].sort();
  }

  private computeDeltaHash(delta: Omit<GraphDelta, "deltaHash">): string {
    const payload = JSON.stringify({
      addedFiles: delta.addedFiles,
      modifiedFiles: delta.modifiedFiles,
      deletedFiles: delta.deletedFiles,
      addedSymbols: delta.addedSymbols.map(s => s.symbolId),
      removedSymbols: delta.removedSymbols.map(s => s.symbolId),
      addedEdges: delta.addedEdges.map(e => e.id),
      removedEdges: delta.removedEdges.map(e => e.id),
      affectedFiles: delta.affectedFiles,
      unresolvedReferences: delta.unresolvedReferences,
      status: delta.status,
    });
    return createHash("sha256").update(payload).digest("hex");
  }
}
