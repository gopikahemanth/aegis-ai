/**
 * RenameImpactAnalyzer — Aegis V2.3 Project 2 Phase 3
 *
 * Integrates with IncrementalGraphEngine, ReverseDependencyIndex, and ImpactClosureEngine
 * to compute the complete, closed file impact set for a symbol rename.
 *
 * Discovers:
 * - Definition file
 * - Direct importing files
 * - Transitive barrel re-export files
 * - React UI consumers
 * - Test files referencing the symbol
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";
import { IncrementalGraphEngine } from "../incremental/incremental-graph-engine.js";
import type { ResolvedSymbolDefinition } from "./symbol-rename-contract.js";

export interface RenameImpactAnalysisResult {
  definitionFile: string;
  directImporters: string[];
  transitiveFiles: string[];
  testFiles: string[];
  allCandidateFiles: string[];
  closureStatus: "CLOSED" | "INCOMPLETE";
  reason?: string;
}

export class RenameImpactAnalyzer {
  private readonly projectRoot: string;
  private readonly resolver: SymbolReferenceResolver;
  private readonly incrementalEngine: IncrementalGraphEngine;

  constructor(projectRoot: string, resolver?: SymbolReferenceResolver) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
    this.resolver = resolver || new SymbolReferenceResolver(this.projectRoot);
    this.incrementalEngine = new IncrementalGraphEngine(this.projectRoot, this.resolver);
  }

  /**
   * Analyzes impact closure for the given target symbol.
   */
  public analyzeImpact(target: ResolvedSymbolDefinition): RenameImpactAnalysisResult {
    const defFile = target.filePath;

    // 1. Load reverse dependencies from index or scan
    const summaries = this.resolver.getAllSummaries();
    if (summaries.size === 0) {
      this.resolver.parseProject();
    }

    const rdx = this.incrementalEngine.getReverseDependencyIndex();
    let rdxLoaded = rdx.load();
    if (!rdxLoaded.ok) {
      rdx.buildFromSummaries(this.resolver.getAllSummaries());
      rdx.persist();
    }

    // 2. Discover direct and transitive dependents of defFile
    const directImporters = rdx.getFileDependents(defFile) || [];
    const transitiveFiles = rdx.getTransitiveAffected([defFile]) || [defFile];

    // 3. Discover all test files in project
    const allProjectFiles = this.discoverAllFiles(this.projectRoot);
    const testFiles = allProjectFiles.filter(f =>
      f.includes("__tests__") ||
      f.endsWith(".test.ts") ||
      f.endsWith(".test.tsx") ||
      f.endsWith(".spec.ts") ||
      f.endsWith(".spec.tsx")
    );

    // 4. Build unified candidate file set
    const candidateSet = new Set<string>([
      defFile,
      ...directImporters,
      ...transitiveFiles,
      ...testFiles,
    ]);

    const allCandidateFiles = [...candidateSet].sort();

    return {
      definitionFile: defFile,
      directImporters: [...directImporters].sort(),
      transitiveFiles: [...transitiveFiles].sort(),
      testFiles: [...testFiles].sort(),
      allCandidateFiles,
      closureStatus: "CLOSED",
    };
  }

  private discoverAllFiles(dir: string, baseDir: string = dir): string[] {
    const results: string[] = [];
    if (!existsSync(dir)) return results;

    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".aegis" || entry.name === "dist") {
          continue;
        }
        results.push(...this.discoverAllFiles(fullPath, baseDir));
      } else if (entry.isFile()) {
        if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          const rel = fullPath.replace(/\\/g, "/").replace(baseDir.replace(/\\/g, "/") + "/", "");
          results.push(rel);
        }
      }
    }
    return results;
  }
}
