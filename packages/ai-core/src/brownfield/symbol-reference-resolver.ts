/**
 * SymbolReferenceResolver
 *
 * Deterministic AST-based TypeScript symbol declaration, import, export,
 * and re-export resolver using the official TypeScript Compiler API.
 */

import ts from "typescript";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, extname } from "node:path";
import { PersistentAstCache } from "./ast-cache/persistent-ast-cache.js";
import { AstCacheValidator } from "./ast-cache/ast-cache-validator.js";
import { AstCacheHash } from "./ast-cache/ast-cache-hash.js";
import type { CachedSymbolEntry } from "./ast-cache/ast-cache-contract.js";

export type SymbolKind =
  | "function"
  | "class"
  | "method"
  | "variable"
  | "constant"
  | "type"
  | "interface"
  | "component"
  | "hook"
  | "enum"
  | "unknown";

export interface SymbolIdentifier {
  id: string; // Unique format: file#exportedName@line:col
  filePath: string;
  name: string;
  localName: string;
  kind: SymbolKind;
  isExported: boolean;
  isDefaultExport: boolean;
  line: number;
  col: number;
}

export interface ImportBinding {
  importerFile: string;
  sourceModuleSpecifier: string;
  resolvedSourceFile?: string;
  importedName: string; // "default", "*", or named symbol
  localAlias: string;
  isTypeOnly: boolean;
  isNamespace: boolean;
  isDynamic: boolean;
  line: number;
  col: number;
}

export interface ExportBinding {
  exporterFile: string;
  exportedName: string; // "default" or named
  localName: string;
  isReExport: boolean;
  reExportModuleSpecifier?: string;
  resolvedSourceFile?: string;
  isWildcard: boolean; // export * from "./x"
  line: number;
  col: number;
}

export interface FileAstSummary {
  filePath: string;
  symbols: SymbolIdentifier[];
  imports: ImportBinding[];
  exports: ExportBinding[];
  unresolvedDynamicImports: string[];
}

export class SymbolReferenceResolver {
  private readonly projectRoot: string;
  private readonly sourceFileCache: Map<string, ts.SourceFile> = new Map();
  private readonly summaryCache: Map<string, FileAstSummary> = new Map();
  private readonly astCache: PersistentAstCache;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
    this.astCache = new PersistentAstCache(this.projectRoot);
  }

  public getAstCache(): PersistentAstCache {
    return this.astCache;
  }

  /**
   * Scans and parses all TypeScript / JavaScript files in the project root.
   */
  public parseProject(options?: { bypassCache?: boolean }): Map<string, FileAstSummary> {
    const allFiles = this.discoverSourceFiles(this.projectRoot);
    const useCache = !options?.bypassCache;

    if (useCache) {
      this.astCache.init();
    }

    for (const filePath of allFiles) {
      const relPath = this.toRelative(filePath);
      const fullPath = resolve(this.projectRoot, relPath);

      if (useCache) {
        const cached = this.astCache.getFileRecord(relPath);
        const val = AstCacheValidator.validateFileRecord(fullPath, cached);

        if (val.status === "CACHE_HIT" || val.status === "CACHE_HIT_REVALIDATED") {
          if (cached) {
            const summary: FileAstSummary = {
              filePath: cached.filePath,
              symbols: cached.symbols,
              imports: cached.imports,
              exports: cached.exports,
              unresolvedDynamicImports: cached.unresolvedDynamicImports || [],
            };
            this.summaryCache.set(relPath, summary);
            continue;
          }
        }
      }

      this.parseFile(filePath);
    }

    // Resolve cross-file import & export target paths
    for (const [, summary] of this.summaryCache) {
      for (const imp of summary.imports) {
        if (!imp.isDynamic) {
          imp.resolvedSourceFile = this.resolveModulePath(summary.filePath, imp.sourceModuleSpecifier);
        }
      }
      for (const exp of summary.exports) {
        if (exp.isReExport && exp.reExportModuleSpecifier) {
          exp.resolvedSourceFile = this.resolveModulePath(summary.filePath, exp.reExportModuleSpecifier);
        }
      }
    }

    // Persist global symbol table and reverse dependencies index
    if (useCache) {
      this.persistGlobalIndexes();
    }

    return this.summaryCache;
  }

  /**
   * Parses a single file and extracts structured symbol declarations, imports, and exports.
   */
  public parseFile(filePath: string, contentOverride?: string): FileAstSummary {
    const relPath = this.toRelative(filePath);
    if (this.summaryCache.has(relPath) && !contentOverride) {
      return this.summaryCache.get(relPath)!;
    }

    const fullPath = resolve(this.projectRoot, relPath);
    const content = contentOverride ?? (existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "");

    const sourceFile = ts.createSourceFile(
      relPath,
      content,
      ts.ScriptTarget.Latest,
      true,
      relPath.endsWith(".tsx") || relPath.endsWith(".jsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    this.sourceFileCache.set(relPath, sourceFile);

    const symbols: SymbolIdentifier[] = [];
    const imports: ImportBinding[] = [];
    const exports: ExportBinding[] = [];
    const unresolvedDynamicImports: string[] = [];

    const visit = (node: ts.Node) => {
      // 1. Import Declarations
      if (ts.isImportDeclaration(node)) {
        this.extractImportDeclaration(node, sourceFile, relPath, imports);
      }

      // 2. Dynamic Import Expressions (import("./x"))
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const arg = node.arguments[0];
        if (arg && ts.isStringLiteral(arg)) {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
          imports.push({
            importerFile: relPath,
            sourceModuleSpecifier: arg.text,
            importedName: "*",
            localAlias: "*",
            isTypeOnly: false,
            isNamespace: false,
            isDynamic: true,
            line: line + 1,
            col: character + 1,
          });
        } else {
          // Dynamic path that cannot be statically resolved
          unresolvedDynamicImports.push(node.getText(sourceFile));
        }
      }

      // 3. Export Declarations & Re-exports
      if (ts.isExportDeclaration(node)) {
        this.extractExportDeclaration(node, sourceFile, relPath, exports);
      }

      // 4. Export Assignments (export default X;)
      if (ts.isExportAssignment(node)) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        const exprName = node.expression.getText(sourceFile);
        exports.push({
          exporterFile: relPath,
          exportedName: "default",
          localName: exprName,
          isReExport: false,
          isWildcard: false,
          line: line + 1,
          col: character + 1,
        });
      }

      // 5. Symbol Declarations (Function, Class, Interface, Type, Const/Let)
      if (
        ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node) ||
        ts.isEnumDeclaration(node)
      ) {
        this.extractTopLevelDeclaration(node, sourceFile, relPath, symbols, exports);
      }

      if (ts.isVariableStatement(node)) {
        this.extractVariableStatement(node, sourceFile, relPath, symbols, exports);
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    const summary: FileAstSummary = {
      filePath: relPath,
      symbols,
      imports,
      exports,
      unresolvedDynamicImports,
    };

    this.summaryCache.set(relPath, summary);

    // Save to persistent cache if not content override and file exists
    if (!contentOverride && existsSync(fullPath)) {
      try {
        const stat = statSync(fullPath);
        const contentHash = AstCacheHash.computeFileHash(fullPath);
        this.astCache.setFileRecord({
          filePath: relPath,
          contentHash,
          mtimeMs: stat.mtimeMs,
          sizeBytes: stat.size,
          symbols,
          imports,
          exports,
          unresolvedDynamicImports,
          callGraphEdges: [],
        });
      } catch {}
    }

    return summary;
  }

  private persistGlobalIndexes(): void {
    const symbolEntries: CachedSymbolEntry[] = [];
    const fileDependents: Record<string, string[]> = {};
    const symbolDependents: Record<string, string[]> = {};

    for (const [, summary] of this.summaryCache) {
      for (const sym of summary.symbols) {
        symbolEntries.push({
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

      for (const imp of summary.imports) {
        if (imp.resolvedSourceFile) {
          if (!fileDependents[imp.resolvedSourceFile]) {
            fileDependents[imp.resolvedSourceFile] = [];
          }
          if (!fileDependents[imp.resolvedSourceFile].includes(summary.filePath)) {
            fileDependents[imp.resolvedSourceFile].push(summary.filePath);
          }
        }
      }
    }

    this.astCache.saveSymbolTable(symbolEntries);
    this.astCache.saveReverseDependencies({ fileDependents, symbolDependents });
  }

  /**
   * Resolves where a target symbol is exported/defined across the import & re-export chain.
   */
  public resolveExportChain(
    originFile: string,
    exportedName: string
  ): { targetFile: string; targetSymbol: SymbolIdentifier } | null {
    const visited = new Set<string>();

    const trace = (file: string, symName: string): { targetFile: string; targetSymbol: SymbolIdentifier } | null => {
      const key = `${file}::${symName}`;
      if (visited.has(key)) return null; // Cycle guard
      visited.add(key);

      const summary = this.summaryCache.get(this.toRelative(file));
      if (!summary) return null;

      // Check local exported symbols
      const localSym = summary.symbols.find(s => (s.name === symName || s.localName === symName) && s.isExported);
      if (localSym) {
        return { targetFile: summary.filePath, targetSymbol: localSym };
      }

      // Check re-exports: export { X as Y } from "./target" or export * from "./target"
      for (const exp of summary.exports) {
        if (exp.isReExport && exp.resolvedSourceFile) {
          if (exp.isWildcard) {
            const found = trace(exp.resolvedSourceFile, symName);
            if (found) return found;
          } else if (exp.exportedName === symName) {
            return trace(exp.resolvedSourceFile, exp.localName);
          }
        }
      }

      return null;
    };

    return trace(originFile, exportedName);
  }

  /**
   * Discovers all files importing a given source symbol directly or via re-exports.
   */
  public findDirectImporters(
    targetFile: string,
    targetSymbolName: string
  ): { importerFile: string; localAlias: string; importBinding: ImportBinding }[] {
    const targetRel = this.toRelative(targetFile);
    const results: { importerFile: string; localAlias: string; importBinding: ImportBinding }[] = [];

    for (const [importerPath, summary] of this.summaryCache) {
      if (importerPath === targetRel) continue;

      for (const imp of summary.imports) {
        if (!imp.resolvedSourceFile) continue;

        // Check direct import from target file
        if (imp.resolvedSourceFile === targetRel) {
          if (imp.isNamespace) {
            results.push({ importerFile: importerPath, localAlias: imp.localAlias, importBinding: imp });
          } else if (imp.importedName === targetSymbolName || (targetSymbolName === "default" && imp.importedName === "default")) {
            results.push({ importerFile: importerPath, localAlias: imp.localAlias, importBinding: imp });
          }
        } else {
          // Check if the imported file is a barrel that re-exports targetSymbolName from targetFile
          const chain = this.resolveExportChain(imp.resolvedSourceFile, imp.importedName);
          if (chain && chain.targetFile === targetRel && (chain.targetSymbol.name === targetSymbolName || chain.targetSymbol.localName === targetSymbolName)) {
            results.push({ importerFile: importerPath, localAlias: imp.localAlias, importBinding: imp });
          }
        }
      }
    }

    return results;
  }

  public getSourceFile(filePath: string): ts.SourceFile | undefined {
    const relPath = this.toRelative(filePath);
    if (this.sourceFileCache.has(relPath)) {
      return this.sourceFileCache.get(relPath);
    }

    const fullPath = resolve(this.projectRoot, relPath);
    if (!existsSync(fullPath)) return undefined;

    try {
      const content = readFileSync(fullPath, "utf8");
      const sourceFile = ts.createSourceFile(
        relPath,
        content,
        ts.ScriptTarget.Latest,
        true,
        relPath.endsWith(".tsx") || relPath.endsWith(".jsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );
      this.sourceFileCache.set(relPath, sourceFile);
      return sourceFile;
    } catch {
      return undefined;
    }
  }

  public getSummary(filePath: string): FileAstSummary | undefined {
    return this.summaryCache.get(this.toRelative(filePath));
  }

  public getAllSummaries(): Map<string, FileAstSummary> {
    return this.summaryCache;
  }

  /**
   * Evicts a file from the in-memory summary and source file caches.
   * Used by the incremental graph engine to force re-parsing of modified files.
   */
  public evictFromCache(filePath: string): void {
    const relPath = this.toRelative(filePath);
    this.summaryCache.delete(relPath);
    this.sourceFileCache.delete(relPath);
  }

  /**
   * Parses a single file fresh from disk, bypassing the in-memory summary cache.
   * Also resolves its imports against the current project's summaries.
   * Used by the incremental engine to re-analyse modified/created files.
   */
  public parseFileFresh(filePath: string): FileAstSummary {
    const relPath = this.toRelative(filePath);
    // Evict stale data
    this.summaryCache.delete(relPath);
    this.sourceFileCache.delete(relPath);
    // Re-parse from disk
    const summary = this.parseFile(relPath);
    // Re-resolve this file's imports
    for (const imp of summary.imports) {
      if (!imp.isDynamic) {
        imp.resolvedSourceFile = this.resolveModulePath(summary.filePath, imp.sourceModuleSpecifier);
      }
    }
    for (const exp of summary.exports) {
      if (exp.isReExport && exp.reExportModuleSpecifier) {
        exp.resolvedSourceFile = this.resolveModulePath(summary.filePath, exp.reExportModuleSpecifier);
      }
    }
    return summary;
  }

  private extractImportDeclaration(
    node: ts.ImportDeclaration,
    sourceFile: ts.SourceFile,
    relPath: string,
    imports: ImportBinding[]
  ) {
    if (!ts.isStringLiteral(node.moduleSpecifier)) return;
    const specifier = node.moduleSpecifier.text;
    const isTypeOnly = !!node.importClause?.isTypeOnly;

    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));

    if (!node.importClause) {
      // Side-effect import: import "./setup";
      imports.push({
        importerFile: relPath,
        sourceModuleSpecifier: specifier,
        importedName: "*",
        localAlias: "*",
        isTypeOnly: false,
        isNamespace: false,
        isDynamic: false,
        line: line + 1,
        col: character + 1,
      });
      return;
    }

    // Default import: import Foo from "./foo"
    if (node.importClause.name) {
      imports.push({
        importerFile: relPath,
        sourceModuleSpecifier: specifier,
        importedName: "default",
        localAlias: node.importClause.name.text,
        isTypeOnly,
        isNamespace: false,
        isDynamic: false,
        line: line + 1,
        col: character + 1,
      });
    }

    const namedBindings = node.importClause.namedBindings;
    if (namedBindings) {
      // Namespace import: import * as Foo from "./foo"
      if (ts.isNamespaceImport(namedBindings)) {
        imports.push({
          importerFile: relPath,
          sourceModuleSpecifier: specifier,
          importedName: "*",
          localAlias: namedBindings.name.text,
          isTypeOnly,
          isNamespace: true,
          isDynamic: false,
          line: line + 1,
          col: character + 1,
        });
      } else if (ts.isNamedImports(namedBindings)) {
        // Named imports: import { A, B as C } from "./foo"
        for (const element of namedBindings.elements) {
          const importedName = element.propertyName ? element.propertyName.text : element.name.text;
          const localAlias = element.name.text;
          imports.push({
            importerFile: relPath,
            sourceModuleSpecifier: specifier,
            importedName,
            localAlias,
            isTypeOnly: isTypeOnly || !!element.isTypeOnly,
            isNamespace: false,
            isDynamic: false,
            line: line + 1,
            col: character + 1,
          });
        }
      }
    }
  }

  private extractExportDeclaration(
    node: ts.ExportDeclaration,
    sourceFile: ts.SourceFile,
    relPath: string,
    exports: ExportBinding[]
  ) {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    const specifier = node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier.text : undefined;

    if (!node.exportClause) {
      // export * from "./mod"
      exports.push({
        exporterFile: relPath,
        exportedName: "*",
        localName: "*",
        isReExport: true,
        reExportModuleSpecifier: specifier,
        isWildcard: true,
        line: line + 1,
        col: character + 1,
      });
      return;
    }

    if (ts.isNamedExports(node.exportClause)) {
      for (const element of node.exportClause.elements) {
        const localName = element.propertyName ? element.propertyName.text : element.name.text;
        const exportedName = element.name.text;

        exports.push({
          exporterFile: relPath,
          exportedName,
          localName,
          isReExport: !!specifier,
          reExportModuleSpecifier: specifier,
          isWildcard: false,
          line: line + 1,
          col: character + 1,
        });
      }
    }
  }

  private extractTopLevelDeclaration(
    node: ts.DeclarationStatement,
    sourceFile: ts.SourceFile,
    relPath: string,
    symbols: SymbolIdentifier[],
    exports: ExportBinding[]
  ) {
    if (!node.name || !ts.isIdentifier(node.name)) return;
    const name = node.name.text;
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));

    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
    const isExported = !!(modifiers && modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword));
    const isDefaultExport = !!(modifiers && modifiers.some(m => m.kind === ts.SyntaxKind.DefaultKeyword));

    let kind: SymbolKind = "unknown";
    if (ts.isFunctionDeclaration(node)) kind = /^[A-Z]/.test(name) ? "component" : name.startsWith("use") ? "hook" : "function";
    else if (ts.isClassDeclaration(node)) kind = "class";
    else if (ts.isInterfaceDeclaration(node)) kind = "interface";
    else if (ts.isTypeAliasDeclaration(node)) kind = "type";
    else if (ts.isEnumDeclaration(node)) kind = "enum";

    const symbol: SymbolIdentifier = {
      id: `${relPath}#${name}@${line + 1}:${character + 1}`,
      filePath: relPath,
      name: isDefaultExport ? "default" : name,
      localName: name,
      kind,
      isExported,
      isDefaultExport,
      line: line + 1,
      col: character + 1,
    };

    symbols.push(symbol);

    if (isExported) {
      exports.push({
        exporterFile: relPath,
        exportedName: isDefaultExport ? "default" : name,
        localName: name,
        isReExport: false,
        isWildcard: false,
        line: line + 1,
        col: character + 1,
      });
    }
  }

  private extractVariableStatement(
    node: ts.VariableStatement,
    sourceFile: ts.SourceFile,
    relPath: string,
    symbols: SymbolIdentifier[],
    exports: ExportBinding[]
  ) {
    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
    const isExported = !!(modifiers && modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword));
    const isDefaultExport = !!(modifiers && modifiers.some(m => m.kind === ts.SyntaxKind.DefaultKeyword));

    for (const decl of node.declarationList.declarations) {
      if (ts.isIdentifier(decl.name)) {
        const name = decl.name.text;
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(decl.getStart(sourceFile));

        let kind: SymbolKind = "variable";
        if (decl.initializer) {
          if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
            kind = /^[A-Z]/.test(name) ? "component" : name.startsWith("use") ? "hook" : "function";
          }
        }

        const symbol: SymbolIdentifier = {
          id: `${relPath}#${name}@${line + 1}:${character + 1}`,
          filePath: relPath,
          name: isDefaultExport ? "default" : name,
          localName: name,
          kind,
          isExported,
          isDefaultExport,
          line: line + 1,
          col: character + 1,
        };

        symbols.push(symbol);

        if (isExported) {
          exports.push({
            exporterFile: relPath,
            exportedName: isDefaultExport ? "default" : name,
            localName: name,
            isReExport: false,
            isWildcard: false,
            line: line + 1,
            col: character + 1,
          });
        }
      }
    }
  }

  public resolveModulePath(fromFilePath: string, specifier: string): string | undefined {
    if (!specifier.startsWith(".") && !specifier.startsWith("@/")) {
      return undefined; // External dependency like "react", "express"
    }

    let basePath: string;
    if (specifier.startsWith("@/")) {
      basePath = join(this.projectRoot, "src", specifier.slice(2));
    } else {
      const fromDir = dirname(resolve(this.projectRoot, fromFilePath));
      basePath = resolve(fromDir, specifier);
    }

    const strippedBase = basePath.replace(/\.(js|jsx|mjs|cjs)$/, "");

    // Direct extension match or candidate resolution
    const candidates = [
      basePath,
      `${strippedBase}.ts`,
      `${strippedBase}.tsx`,
      `${strippedBase}.js`,
      `${strippedBase}.jsx`,
      `${basePath}.ts`,
      `${basePath}.tsx`,
      join(basePath, "index.ts"),
      join(basePath, "index.tsx"),
      join(basePath, "index.js"),
      join(basePath, "index.jsx"),
      join(strippedBase, "index.ts"),
      join(strippedBase, "index.tsx"),
    ];

    for (const cand of candidates) {
      if (existsSync(cand) && !statSync(cand).isDirectory()) {
        return this.toRelative(cand);
      }
    }

    return undefined;
  }

  private discoverSourceFiles(dir: string): string[] {
    const files: string[] = [];
    const validExts = new Set([".ts", ".tsx", ".js", ".jsx"]);

    const walk = (currentDir: string) => {
      if (!existsSync(currentDir)) return;
      for (const item of readdirSync(currentDir)) {
        if (item === "node_modules" || item === "dist" || item === ".git" || item === ".aegis") continue;
        const full = join(currentDir, item);
        const stat = statSync(full);
        if (stat.isDirectory()) {
          walk(full);
        } else if (validExts.has(extname(item))) {
          files.push(this.toRelative(full));
        }
      }
    };

    walk(dir);
    return files;
  }

  private toRelative(p: string): string {
    const normalizedProject = this.projectRoot.replace(/\\/g, "/");
    const normalizedP = p.replace(/\\/g, "/");
    if (normalizedP.startsWith(normalizedProject)) {
      return normalizedP.slice(normalizedProject.length).replace(/^(\/|\\)+/, "");
    }
    return normalizedP.replace(/^(\/|\\)+/, "");
  }
}
