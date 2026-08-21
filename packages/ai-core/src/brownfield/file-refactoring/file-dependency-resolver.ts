/**
 * FileDependencyResolver — Aegis V2.3 Project 2 Phase 5
 *
 * Discovers all file-level and symbol-level relationships for a source file:
 * - Direct importing files
 * - Barrel re-export files
 * - Test file references
 * - Path alias references
 * - Internal relative imports inside the source file itself
 * - Dynamic import / require references
 */

import ts from "typescript";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";
import { IncrementalGraphEngine } from "../incremental/incremental-graph-engine.js";

export interface FileDependencyAnalysisResult {
  sourceFile: string;
  directImporters: string[];
  barrelReExporters: string[];
  testFiles: string[];
  internalImports: { specifier: string; resolvedTarget: string }[];
  dynamicImportFiles: string[];
  allCandidateFiles: string[];
}

export class FileDependencyResolver {
  private readonly projectRoot: string;
  private readonly resolver: SymbolReferenceResolver;
  private readonly incrementalEngine: IncrementalGraphEngine;

  constructor(projectRoot: string, resolver?: SymbolReferenceResolver) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
    this.resolver = resolver || new SymbolReferenceResolver(this.projectRoot);
    this.incrementalEngine = new IncrementalGraphEngine(this.projectRoot, this.resolver);
  }

  /**
   * Discovers all dependents and internal dependencies for a target source file.
   */
  public resolveDependencies(sourceFilePath: string): FileDependencyAnalysisResult {
    const relSource = sourceFilePath.replace(/\\/g, "/").replace(/^(\/|\\)+/, "");
    const fullSource = resolve(this.projectRoot, relSource);

    // Discover all project files
    const allProjectFiles = this.discoverAllFiles(this.projectRoot);

    const directImporters = new Set<string>();
    const barrelReExporters = new Set<string>();
    const testFiles = new Set<string>();
    const dynamicImportFiles = new Set<string>();
    const internalImports: { specifier: string; resolvedTarget: string }[] = [];

    // 1. Scan source file's own internal imports
    if (existsSync(fullSource)) {
      const sourceContent = readFileSync(fullSource, "utf8");
      const isTsx = relSource.endsWith(".tsx") || relSource.endsWith(".jsx");
      const sf = ts.createSourceFile(
        relSource,
        sourceContent,
        ts.ScriptTarget.Latest,
        true,
        isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );

      ts.forEachChild(sf, node => {
        if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
          const spec = node.moduleSpecifier.text;
          const resolved = this.resolver.resolveModulePath(relSource, spec);
          if (resolved) {
            internalImports.push({ specifier: spec, resolvedTarget: resolved });
          }
        } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          const spec = node.moduleSpecifier.text;
          const resolved = this.resolver.resolveModulePath(relSource, spec);
          if (resolved) {
            internalImports.push({ specifier: spec, resolvedTarget: resolved });
          }
        }
      });
    }

    // 2. Scan all project files for references to relSource
    for (const file of allProjectFiles) {
      if (file === relSource) continue;
      const full = resolve(this.projectRoot, file);
      if (!existsSync(full)) continue;

      let content = "";
      try {
        content = readFileSync(full, "utf8");
      } catch {
        continue;
      }

      // Check dynamic imports
      if (/import\s*\(\s*`[^`]*\$\{|import\s*\(\s*[a-zA-Z_$]/.test(content) || /require\s*\(\s*`[^`]*\$\{|require\s*\(\s*[a-zA-Z_$]/.test(content)) {
        dynamicImportFiles.add(file);
      }

      const isTsx = file.endsWith(".tsx") || file.endsWith(".jsx");
      const isTest = file.includes("__tests__") || file.endsWith(".test.ts") || file.endsWith(".test.tsx") || file.endsWith(".spec.ts");
      const isBarrel = file.endsWith("index.ts") || file.endsWith("index.tsx") || file.endsWith("index.js");

      const sf = ts.createSourceFile(
        file,
        content,
        ts.ScriptTarget.Latest,
        true,
        isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );

      ts.forEachChild(sf, node => {
        if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
          const spec = node.moduleSpecifier.text;
          const resolved = this.resolver.resolveModulePath(file, spec);
          if (resolved === relSource) {
            directImporters.add(file);
            if (isTest) testFiles.add(file);
          }
        } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          const spec = node.moduleSpecifier.text;
          const resolved = this.resolver.resolveModulePath(file, spec);
          if (resolved === relSource) {
            directImporters.add(file);
            if (isBarrel) barrelReExporters.add(file);
          }
        }
      });
    }

    const candidateSet = new Set<string>([
      relSource,
      ...directImporters,
      ...barrelReExporters,
      ...testFiles,
    ]);

    return {
      sourceFile: relSource,
      directImporters: [...directImporters].sort(),
      barrelReExporters: [...barrelReExporters].sort(),
      testFiles: [...testFiles].sort(),
      internalImports,
      dynamicImportFiles: [...dynamicImportFiles].sort(),
      allCandidateFiles: [...candidateSet].sort(),
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
        if (/\.(ts|tsx|js|jsx|css|json)$/.test(entry.name)) {
          const rel = fullPath.replace(/\\/g, "/").replace(baseDir.replace(/\\/g, "/") + "/", "");
          results.push(rel);
        }
      }
    }
    return results;
  }
}
