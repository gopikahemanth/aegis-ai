/**
 * FileOperationPlanner — Aegis V2.3 Project 2 Phase 5
 *
 * Master planner for file rename and move operations:
 * - Computes complete dependency closure
 * - Generates AST import/export rewrite patches
 * - Rewrites internal relative imports inside moved files
 * - Updates barrel re-exports
 * - Computes deterministic planHash & patchHash
 */

import ts from "typescript";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";
import { FileDependencyResolver } from "./file-dependency-resolver.js";
import { FileCollisionAnalyzer } from "./file-collision-analyzer.js";
import { ImportPathRewriter } from "./import-path-rewriter.js";
import { BarrelExportResolver } from "./barrel-export-resolver.js";
import type { AstPatchOperation } from "../ast-symbol-patch-planner.js";
import type {
  FileRefactoringRequest,
  FileRefactoringPlan,
  FileImportReference,
  FileRefactoringStatus,
} from "./file-refactoring-contract.js";

export class FileOperationPlanner {
  private readonly projectRoot: string;
  private readonly resolver: SymbolReferenceResolver;
  private readonly depResolver: FileDependencyResolver;
  private readonly collisionAnalyzer: FileCollisionAnalyzer;
  private readonly barrelResolver: BarrelExportResolver;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
    this.resolver = new SymbolReferenceResolver(this.projectRoot);
    this.depResolver = new FileDependencyResolver(this.projectRoot, this.resolver);
    this.collisionAnalyzer = new FileCollisionAnalyzer(this.projectRoot);
    this.barrelResolver = new BarrelExportResolver(this.projectRoot, this.resolver);
  }

  /**
   * Plans a safe, AST-aware file refactoring operation.
   */
  public plan(request: FileRefactoringRequest): FileRefactoringPlan {
    const { operation, sourcePath, targetPath } = request;
    const cleanSource = sourcePath.replace(/\\/g, "/").replace(/^(\/|\\)+/, "");
    const cleanTarget = targetPath.replace(/\\/g, "/").replace(/^(\/|\\)+/, "");

    // 1. Discover all file-level and symbol-level dependencies
    const depResult = this.depResolver.resolveDependencies(cleanSource);

    // 2. Collision and safety analysis
    const collisionResult = this.collisionAnalyzer.analyze(
      cleanSource,
      cleanTarget,
      depResult.dynamicImportFiles
    );

    if (collisionResult.hasConflicts) {
      return this.createEmptyPlan(
        operation,
        cleanSource,
        cleanTarget,
        collisionResult.status,
        collisionResult.blockedReasons,
        collisionResult.conflicts
      );
    }

    const rawPatches: AstPatchOperation[] = [];
    const importRefs: FileImportReference[] = [];
    const exportRefs: FileImportReference[] = [];
    const affectedFilesSet = new Set<string>([cleanSource]);

    // 3. Plan import rewrites in importing files
    for (const importerFile of depResult.directImporters) {
      const fullPath = resolve(this.projectRoot, importerFile);
      if (!existsSync(fullPath)) continue;

      const content = readFileSync(fullPath, "utf8");
      const isTsx = importerFile.endsWith(".tsx") || importerFile.endsWith(".jsx");
      const sf = ts.createSourceFile(
        importerFile,
        content,
        ts.ScriptTarget.Latest,
        true,
        isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );

      ts.forEachChild(sf, node => {
        if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
          const spec = node.moduleSpecifier.text;
          const resolved = this.resolver.resolveModulePath(importerFile, spec);

          if (resolved === cleanSource) {
            const newSpecifier = ImportPathRewriter.computeRelativeSpecifier(
              importerFile,
              cleanTarget,
              spec
            );

            const patch = ImportPathRewriter.createImportPatch(
              importerFile,
              node.moduleSpecifier,
              newSpecifier,
              sf
            );
            rawPatches.push(patch);
            affectedFilesSet.add(importerFile);

            const { line, character } = sf.getLineAndCharacterOfPosition(node.moduleSpecifier.getStart(sf));
            importRefs.push({
              importerFilePath: importerFile,
              sourceModuleSpecifier: spec,
              newModuleSpecifier: newSpecifier,
              isAliased: spec.startsWith("@/"),
              isBarrelExport: false,
              isSelfInternalImport: false,
              startPos: node.moduleSpecifier.getStart(sf),
              endPos: node.moduleSpecifier.getEnd(),
              line: line + 1,
              col: character + 1,
            });
          }
        }
      });
    }

    // 4. Plan barrel re-export updates
    for (const barrelFile of depResult.barrelReExporters) {
      const barrelResult = this.barrelResolver.planBarrelUpdates(barrelFile, cleanSource, cleanTarget);
      if (barrelResult.patches.length > 0) {
        rawPatches.push(...barrelResult.patches);
        affectedFilesSet.add(barrelFile);
      }
    }

    // 5. If file is MOVED (directory changed), rewrite its OWN internal relative imports
    const isMoved = cleanSource !== cleanTarget;
    if (isMoved && depResult.internalImports.length > 0) {
      const sourceFull = resolve(this.projectRoot, cleanSource);
      if (existsSync(sourceFull)) {
        const sourceContent = readFileSync(sourceFull, "utf8");
        const isTsx = cleanSource.endsWith(".tsx") || cleanSource.endsWith(".jsx");
        const sf = ts.createSourceFile(
          cleanSource,
          sourceContent,
          ts.ScriptTarget.Latest,
          true,
          isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
        );

        ts.forEachChild(sf, node => {
          if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
            const spec = node.moduleSpecifier.text;
            const resolvedTarget = this.resolver.resolveModulePath(cleanSource, spec);

            if (resolvedTarget && resolvedTarget !== cleanSource) {
              const newSpecifier = ImportPathRewriter.computeRelativeSpecifier(
                cleanTarget, // from new location
                resolvedTarget, // to existing target
                spec
              );

              if (newSpecifier !== spec) {
                const patch = ImportPathRewriter.createImportPatch(
                  cleanSource,
                  node.moduleSpecifier,
                  newSpecifier,
                  sf,
                  `Update internal relative import to "${newSpecifier}"`
                );
                rawPatches.push(patch);
              }
            }
          }
        });
      }
    }

    // Group and sort patches per file descending by startPos
    const fileMap = new Map<string, AstPatchOperation[]>();
    for (const op of rawPatches) {
      if (!fileMap.has(op.filePath)) fileMap.set(op.filePath, []);
      fileMap.get(op.filePath)!.push(op);
    }

    const filePatches: { filePath: string; operations: AstPatchOperation[] }[] = [];
    for (const filePath of [...fileMap.keys()].sort()) {
      const ops = fileMap.get(filePath)!;
      ops.sort((a, b) => b.startPos - a.startPos);
      filePatches.push({ filePath, operations: ops });
    }

    const affectedFiles = [...affectedFilesSet].sort();
    const planHash = this.computePlanHash(operation, cleanSource, cleanTarget, affectedFiles, "READY");
    const patchHash = this.computePatchHash(filePatches);

    return {
      operation,
      sourcePath: cleanSource,
      targetPath: cleanTarget,
      isCaseOnlyRename: collisionResult.isCaseOnlyRename,
      affectedFiles,
      affectedSymbols: [cleanSource],
      importReferences: importRefs,
      exportReferences: exportRefs,
      testReferences: depResult.testFiles,
      aliasReferences: [],
      dynamicReferences: depResult.dynamicImportFiles,
      conflicts: [],
      riskLevel: affectedFiles.length > 5 ? "HIGH" : affectedFiles.length > 2 ? "MEDIUM" : "LOW",
      blockedReasons: [],
      filePatches,
      planHash,
      patchHash,
      status: "READY",
    };
  }

  // ── Deterministic Hashes ──────────────────────────────────────────────────────

  private computePlanHash(
    operation: string,
    sourcePath: string,
    targetPath: string,
    affectedFiles: string[],
    status: string
  ): string {
    const head = this.getRepoHead();
    const preimages: Record<string, string> = {};
    for (const f of affectedFiles) {
      const full = resolve(this.projectRoot, f);
      if (existsSync(full)) {
        preimages[f] = createHash("sha256").update(readFileSync(full)).digest("hex");
      }
    }

    const payload = JSON.stringify({
      repoHead: head,
      operation,
      sourcePath,
      targetPath,
      affectedFiles,
      preimages,
      status,
    });
    return createHash("sha256").update(payload).digest("hex");
  }

  private computePatchHash(filePatches: { filePath: string; operations: AstPatchOperation[] }[]): string {
    const payload = JSON.stringify(
      filePatches.map(p => ({
        filePath: p.filePath,
        operations: p.operations.map(op => ({
          startPos: op.startPos,
          endPos: op.endPos,
          original: op.originalSnippet,
          replacement: op.replacementSnippet,
        })),
      }))
    );
    return createHash("sha256").update(payload).digest("hex");
  }

  private getRepoHead(): string {
    try {
      return execSync("git rev-parse HEAD", { cwd: this.projectRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    } catch {
      return "0000000000000000000000000000000000000000";
    }
  }

  private createEmptyPlan(
    operation: any,
    sourcePath: string,
    targetPath: string,
    status: FileRefactoringStatus,
    blockedReasons: string[],
    conflicts: string[] = []
  ): FileRefactoringPlan {
    return {
      operation,
      sourcePath,
      targetPath,
      isCaseOnlyRename: false,
      affectedFiles: [sourcePath],
      affectedSymbols: [sourcePath],
      importReferences: [],
      exportReferences: [],
      testReferences: [],
      aliasReferences: [],
      dynamicReferences: [],
      conflicts,
      riskLevel: "BLOCKED",
      blockedReasons,
      filePatches: [],
      planHash: "0".repeat(64),
      patchHash: "0".repeat(64),
      status,
    };
  }
}
