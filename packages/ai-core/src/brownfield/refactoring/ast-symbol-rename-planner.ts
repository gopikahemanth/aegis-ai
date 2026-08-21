/**
 * ASTSymbolRenamePlanner — Aegis V2.3 Project 2 Phase 3
 *
 * Orchestrates symbol definition discovery, reference indexing, impact analysis,
 * conflict detection, AST patch generation, and deterministic plan/patch hashing.
 *
 * SAFETY INVARIANTS:
 * 1. A rename plan is READY only when all references are proven and zero conflicts exist.
 * 2. Patches are sorted descending by startPos per file for safe offset application.
 * 3. Never produces blind text replace — strictly uses exact AST node ranges.
 * 4. Deterministic planHash and patchHash calculated over canonical inputs.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";
import { SymbolDefinitionResolver } from "./symbol-definition-resolver.js";
import { SymbolReferenceIndex } from "./symbol-reference-index.js";
import { RenameImpactAnalyzer } from "./rename-impact-analyzer.js";
import { RenameConflictDetector } from "./rename-conflict-detector.js";
import type { AstPatchOperation } from "../ast-symbol-patch-planner.js";
import type {
  SymbolRenameRequest,
  SymbolRenamePlan,
  ResolvedSymbolDefinition,
  SymbolReferenceLocation,
  SymbolRenameStatus,
} from "./symbol-rename-contract.js";

export class ASTSymbolRenamePlanner {
  private readonly projectRoot: string;
  private readonly resolver: SymbolReferenceResolver;
  private readonly defResolver: SymbolDefinitionResolver;
  private readonly refIndex: SymbolReferenceIndex;
  private readonly impactAnalyzer: RenameImpactAnalyzer;
  private readonly conflictDetector: RenameConflictDetector;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
    this.resolver = new SymbolReferenceResolver(this.projectRoot);
    this.defResolver = new SymbolDefinitionResolver(this.projectRoot);
    this.refIndex = new SymbolReferenceIndex(this.projectRoot, this.resolver);
    this.impactAnalyzer = new RenameImpactAnalyzer(this.projectRoot, this.resolver);
    this.conflictDetector = new RenameConflictDetector(this.projectRoot);
  }

  /**
   * Plans a safe, AST-local symbol rename.
   */
  public planRename(request: SymbolRenameRequest): SymbolRenamePlan {
    const { sourceFile, symbolName, newName, symbolKind } = request;
    const relSourceFile = sourceFile.replace(/\\/g, "/").replace(/^(\/|\\)+/, "");

    // 1. Resolve exact symbol definition
    const def: ResolvedSymbolDefinition | null = this.defResolver.resolveDefinition(
      relSourceFile,
      symbolName,
      symbolKind
    );

    if (!def) {
      return this.createEmptyPlan(relSourceFile, symbolName, newName, "SYMBOL_NOT_FOUND", [
        `Symbol "${symbolName}" could not be found in file "${relSourceFile}".`,
      ]);
    }

    // 2. Impact analysis: discover candidate files (definition, importers, barrels, UI, tests)
    const impact = this.impactAnalyzer.analyzeImpact(def);

    // 3. Reference discovery across candidate files
    const references = this.refIndex.findReferences(def, impact.allCandidateFiles, newName);

    // 4. Conflict detection across candidate files
    const conflictResult = this.conflictDetector.detectConflicts(def, newName, impact.allCandidateFiles);

    // 5. Group references by file and create AST patch operations
    const requiredFilesSet = new Set<string>();
    const filePatchesMap = new Map<string, AstPatchOperation[]>();

    for (const ref of references) {
      requiredFilesSet.add(ref.filePath);

      if (!filePatchesMap.has(ref.filePath)) {
        filePatchesMap.set(ref.filePath, []);
      }

      filePatchesMap.get(ref.filePath)!.push({
        filePath: ref.filePath,
        targetSymbolName: symbolName,
        originalSnippet: ref.matchedText,
        replacementSnippet: ref.replacementText,
        startPos: ref.startPos,
        endPos: ref.endPos,
        description: `Rename ${ref.kind} "${ref.matchedText}" → "${ref.replacementText}" at line ${ref.line}:${ref.col}`,
      });
    }

    // Sort operations per file in DESCENDING order of startPos (so later replacements don't invalidate earlier offsets)
    const patches: { filePath: string; operations: AstPatchOperation[] }[] = [];
    const sortedFilePaths = [...filePatchesMap.keys()].sort();

    for (const filePath of sortedFilePaths) {
      const ops = filePatchesMap.get(filePath)!;
      ops.sort((a, b) => b.startPos - a.startPos);
      patches.push({ filePath, operations: ops });
    }

    const requiredFiles = [...requiredFilesSet].sort();
    const referenceFiles = requiredFiles.filter(f => f !== def.filePath);
    const affectedSymbols = [def.symbolId];

    // Status evaluation
    let status: SymbolRenameStatus = conflictResult.status;
    if (conflictResult.hasConflicts) {
      status = conflictResult.status;
    } else if (references.length === 0) {
      status = "RENAME_ANALYSIS_INCOMPLETE";
    }

    // 6. Compute deterministic planHash and patchHash
    const planHash = this.computePlanHash(def, newName, requiredFiles, status);
    const patchHash = this.computePatchHash(patches);

    return {
      sourceSymbol: def,
      targetName: newName,
      definitionFiles: [def.filePath],
      referenceFiles,
      affectedSymbols,
      requiredFiles,
      references,
      conflicts: conflictResult.conflicts,
      blockedReasons: conflictResult.blockedReasons,
      patches,
      planHash,
      patchHash,
      status,
    };
  }

  // ── Deterministic Hashes ──────────────────────────────────────────────────────

  private computePlanHash(
    def: ResolvedSymbolDefinition,
    newName: string,
    requiredFiles: string[],
    status: SymbolRenameStatus
  ): string {
    const head = this.getRepoHead();
    const preimages: Record<string, string> = {};
    for (const f of requiredFiles) {
      const full = resolve(this.projectRoot, f);
      if (existsSync(full)) {
        preimages[f] = createHash("sha256").update(readFileSync(full)).digest("hex");
      }
    }

    const payload = JSON.stringify({
      repoHead: head,
      sourceFile: def.filePath,
      sourceSymbolId: def.symbolId,
      symbolName: def.name,
      symbolKind: def.kind,
      newName,
      requiredFiles,
      preimages,
      status,
    });

    return createHash("sha256").update(payload).digest("hex");
  }

  private computePatchHash(patches: { filePath: string; operations: AstPatchOperation[] }[]): string {
    const payload = JSON.stringify(
      patches.map(p => ({
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
    sourceFile: string,
    symbolName: string,
    newName: string,
    status: SymbolRenameStatus,
    blockedReasons: string[]
  ): SymbolRenamePlan {
    const dummyDef: ResolvedSymbolDefinition = {
      symbolId: `${sourceFile}#${symbolName}@0:0`,
      filePath: sourceFile,
      name: symbolName,
      kind: "unknown",
      isExported: false,
      isDefaultExport: false,
      startPos: 0,
      endPos: 0,
      nameStartPos: 0,
      nameEndPos: 0,
      line: 0,
      col: 0,
      scopeId: "global",
    };

    return {
      sourceSymbol: dummyDef,
      targetName: newName,
      definitionFiles: [sourceFile],
      referenceFiles: [],
      affectedSymbols: [],
      requiredFiles: [sourceFile],
      references: [],
      conflicts: [],
      blockedReasons,
      patches: [],
      planHash: "0".repeat(64),
      patchHash: "0".repeat(64),
      status,
    };
  }
}
