/**
 * IncrementalGraphUpdater — Aegis V2.3 Project 2 Phase 2
 *
 * Incrementally updates PersistentAstCache symbol tables, reverse dependency indexes,
 * and individual file records without full repository re-parsing.
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";
import type { PersistentAstCache } from "./persistent-ast-cache.js";
import type { CachedSymbolEntry } from "./ast-cache-contract.js";
import type { IncrementalImpactSet } from "./dependency-invalidation-engine.js";

export interface IncrementalAnalysisMetrics {
  totalFiles: number;
  filesHashed: number;
  filesParsed: number;
  cacheHits: number;
  cacheMisses: number;
  graphNodesUpdated: number;
  graphNodesPreserved: number;
  fullReindex: boolean;
}

export class IncrementalGraphUpdater {
  private readonly projectRoot: string;
  private readonly cache: PersistentAstCache;

  constructor(projectRoot: string, cache: PersistentAstCache) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
    this.cache = cache;
  }

  /**
   * Applies an incremental update to the AST cache for the given impact set.
   */
  public updateGraph(impactSet: IncrementalImpactSet): {
    success: boolean;
    metrics: IncrementalAnalysisMetrics;
    error?: string;
  } {
    const metrics: IncrementalAnalysisMetrics = {
      totalFiles: 0,
      filesHashed: impactSet.changedFiles.length,
      filesParsed: 0,
      cacheHits: 0,
      cacheMisses: 0,
      graphNodesUpdated: 0,
      graphNodesPreserved: 0,
      fullReindex: impactSet.requiresFullReindex,
    };

    if (impactSet.blockedReasons.length > 0) {
      return {
        success: false,
        metrics,
        error: impactSet.blockedReasons.join("; "),
      };
    }

    const resolver = new SymbolReferenceResolver(this.projectRoot);
    const existingSymbols = this.cache.loadSymbolTable() || [];
    const existingReverseDeps = this.cache.loadReverseDependencies() || {
      fileDependents: {},
      symbolDependents: {},
    };

    // Filter out removed and modified files from indexes
    const updatedSymbolsMap = new Map<string, CachedSymbolEntry>();
    for (const s of existingSymbols) {
      if (!impactSet.changedFiles.includes(s.filePath)) {
        updatedSymbolsMap.set(s.symbolId, s);
        metrics.graphNodesPreserved++;
      }
    }

    const updatedFileDependents: Record<string, string[]> = {};
    for (const [target, importers] of Object.entries(existingReverseDeps.fileDependents)) {
      if (!impactSet.changedFiles.includes(target)) {
        updatedFileDependents[target] = importers.filter(i => !impactSet.changedFiles.includes(i));
      }
    }

    // Process changed files
    for (const relPath of impactSet.changedFiles) {
      const fullPath = resolve(this.projectRoot, relPath);

      // If removed, delete cache record
      if (!existsSync(fullPath)) {
        this.cache.deleteFileRecord(relPath);
        continue;
      }

      // Reparse changed file via SymbolReferenceResolver
      const summary = resolver.parseFile(relPath);
      const fileRecord = this.cache.getFileRecord(relPath);

      metrics.filesParsed++;
      metrics.cacheMisses++;

      // Register new symbols
      for (const sym of summary.symbols) {
        const symbolId = sym.id || `${relPath}#${sym.name}@${sym.line}:${sym.col}`;
        updatedSymbolsMap.set(symbolId, {
          symbolId,
          filePath: relPath,
          symbolName: sym.name,
          kind: sym.kind,
          isExported: sym.isExported,
          isDefaultExport: sym.isDefaultExport || false,
          line: sym.line,
          col: sym.col,
        });
        metrics.graphNodesUpdated++;
      }

      // Register imports in reverse dependencies
      for (const imp of summary.imports) {
        const resolvedTarget = imp.resolvedSourceFile || resolver.resolveModulePath(relPath, imp.sourceModuleSpecifier);
        if (resolvedTarget) {
          if (!updatedFileDependents[resolvedTarget]) {
            updatedFileDependents[resolvedTarget] = [];
          }
          if (!updatedFileDependents[resolvedTarget].includes(relPath)) {
            updatedFileDependents[resolvedTarget].push(relPath);
          }
        }
      }
    }

    // Save updated indexes
    this.cache.saveSymbolTable([...updatedSymbolsMap.values()]);
    this.cache.saveReverseDependencies({
      fileDependents: updatedFileDependents,
      symbolDependents: existingReverseDeps.symbolDependents || {},
    });

    return {
      success: true,
      metrics,
    };
  }
}
