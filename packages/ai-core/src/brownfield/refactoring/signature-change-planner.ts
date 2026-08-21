/**
 * SignatureChangePlanner — Aegis V2.3 Project 2 Phase 4
 *
 * Master planner for compound AST refactorings:
 * - Function signature & parameter addition/removal
 * - React prop addition & removal
 * - Type & interface field addition & removal
 * - Function extraction
 *
 * Generates exact AST patch operations sorted descending by startPos per file
 * and computes deterministic cryptographic planHash & patchHash.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { SymbolDefinitionResolver } from "./symbol-definition-resolver.js";
import { RenameImpactAnalyzer } from "./rename-impact-analyzer.js";
import { ParameterChangeAnalyzer } from "./parameter-change-analyzer.js";
import { ReactPropRefactoringPlanner } from "./react-prop-refactoring-planner.js";
import { TypeFieldRefactoringPlanner } from "./type-field-refactoring-planner.js";
import { FunctionExtractionPlanner } from "./function-extraction-planner.js";
import { RefactoringConflictAnalyzer } from "./refactoring-conflict-analyzer.js";
import type { AstPatchOperation } from "../ast-symbol-patch-planner.js";
import type {
  AdvancedRefactoringRequest,
  AdvancedRefactoringPlan,
  AdvancedRefactoringStatus,
} from "./advanced-refactoring-contract.js";

export class SignatureChangePlanner {
  private readonly projectRoot: string;
  private readonly defResolver: SymbolDefinitionResolver;
  private readonly impactAnalyzer: RenameImpactAnalyzer;
  private readonly paramAnalyzer: ParameterChangeAnalyzer;
  private readonly propPlanner: ReactPropRefactoringPlanner;
  private readonly typePlanner: TypeFieldRefactoringPlanner;
  private readonly extractionPlanner: FunctionExtractionPlanner;
  private readonly conflictAnalyzer: RefactoringConflictAnalyzer;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
    this.defResolver = new SymbolDefinitionResolver(this.projectRoot);
    this.impactAnalyzer = new RenameImpactAnalyzer(this.projectRoot);
    this.paramAnalyzer = new ParameterChangeAnalyzer(this.projectRoot);
    this.propPlanner = new ReactPropRefactoringPlanner(this.projectRoot);
    this.typePlanner = new TypeFieldRefactoringPlanner(this.projectRoot);
    this.extractionPlanner = new FunctionExtractionPlanner(this.projectRoot);
    this.conflictAnalyzer = new RefactoringConflictAnalyzer(this.projectRoot);
  }

  /**
   * Plans an advanced AST refactoring.
   */
  public plan(request: AdvancedRefactoringRequest): AdvancedRefactoringPlan {
    const { operation, targetSymbol, sourceFile } = request;
    const relSource = sourceFile.replace(/\\/g, "/").replace(/^(\/|\\)+/, "");

    // 0. Prisma Safety Guard
    if (relSource.endsWith(".prisma") || targetSymbol.startsWith("Prisma")) {
      return this.createEmptyPlan(operation, targetSymbol, relSource, "BLOCKED", [
        "PRISMA_MODEL_RENAME_BLOCKED: Destructive database model refactoring is blocked.",
      ]);
    }

    // Handle extraction operation directly
    if (operation === "EXTRACT_FUNCTION" && request.extraction) {
      const extResult = this.extractionPlanner.planFunctionExtraction(relSource, request.extraction);
      if (!extResult.valid) {
        return this.createEmptyPlan(operation, targetSymbol, relSource, "EXTRACTION_ANALYSIS_INCOMPLETE", [
          extResult.blockedReason || "Extraction failed.",
        ]);
      }
      return this.finalizePlan(operation, targetSymbol, relSource, [relSource], extResult.patches, "READY", [], []);
    }

    // 1. Resolve exact target symbol definition
    const def = this.defResolver.resolveDefinition(relSource, targetSymbol);
    if (!def) {
      return this.createEmptyPlan(operation, targetSymbol, relSource, "SYMBOL_NOT_FOUND", [
        `Symbol "${targetSymbol}" could not be found in "${relSource}".`,
      ]);
    }

    // 2. Discover impacted files (definition, callers, tests, UI components)
    const impact = this.impactAnalyzer.analyzeImpact(def);

    // 3. Conflict Analysis
    const conflictResult = this.conflictAnalyzer.analyze(request, def, impact.allCandidateFiles);
    if (conflictResult.hasConflicts) {
      return this.createEmptyPlan(
        operation,
        targetSymbol,
        relSource,
        conflictResult.status,
        conflictResult.blockedReasons,
        conflictResult.conflicts
      );
    }

    // 4. Delegate to specialized planner based on operation
    const rawPatches: AstPatchOperation[] = [];
    const affectedFilesSet = new Set<string>([relSource]);
    let status: AdvancedRefactoringStatus = "READY";
    const blockedReasons: string[] = [];

    switch (operation) {
      case "PARAMETER_ADD":
      case "FUNCTION_SIGNATURE_CHANGE": {
        if (request.parameters && request.parameters.length > 0) {
          for (const param of request.parameters) {
            const res = this.paramAnalyzer.planParameterAddition(def, param, impact.allCandidateFiles);
            if (!res.valid) {
              status = "BLOCKED";
              blockedReasons.push(res.blockedReason || "Parameter addition failed.");
            } else {
              if (res.definitionPatch) rawPatches.push(res.definitionPatch);
              rawPatches.push(...res.callSitePatches);
              res.affectedFiles.forEach(f => affectedFilesSet.add(f));
            }
          }
        }
        break;
      }

      case "PARAMETER_REMOVE": {
        if (request.removeParameterName) {
          const res = this.paramAnalyzer.planParameterRemoval(def, request.removeParameterName, impact.allCandidateFiles);
          if (!res.valid) {
            status = "BLOCKED";
            blockedReasons.push(res.blockedReason || "Parameter removal failed.");
          } else {
            if (res.definitionPatch) rawPatches.push(res.definitionPatch);
            rawPatches.push(...res.callSitePatches);
            res.affectedFiles.forEach(f => affectedFilesSet.add(f));
          }
        }
        break;
      }

      case "REACT_PROP_ADD": {
        if (request.newProps && request.newProps.length > 0) {
          for (const prop of request.newProps) {
            const res = this.propPlanner.planPropAddition(def, prop, impact.allCandidateFiles);
            if (!res.valid) {
              status = "BLOCKED";
              blockedReasons.push(res.blockedReason || "React prop addition failed.");
            } else {
              if (res.interfacePatch) rawPatches.push(res.interfacePatch);
              if (res.componentPatch) rawPatches.push(res.componentPatch);
              rawPatches.push(...res.jsxPatches);
              res.affectedFiles.forEach(f => affectedFilesSet.add(f));
            }
          }
        }
        break;
      }

      case "REACT_PROP_REMOVE": {
        if (request.removePropName) {
          const res = this.propPlanner.planPropRemoval(def, request.removePropName, impact.allCandidateFiles);
          if (!res.valid) {
            status = "BLOCKED";
            blockedReasons.push(res.blockedReason || "React prop removal failed.");
          } else {
            rawPatches.push(...res.jsxPatches);
            res.affectedFiles.forEach(f => affectedFilesSet.add(f));
          }
        }
        break;
      }

      case "TYPE_FIELD_ADD": {
        if (request.newFields && request.newFields.length > 0) {
          for (const field of request.newFields) {
            const res = this.typePlanner.planFieldAddition(def, field, impact.allCandidateFiles);
            if (!res.valid) {
              status = "BLOCKED";
              blockedReasons.push(res.blockedReason || "Type field addition failed.");
            } else {
              if (res.definitionPatch) rawPatches.push(res.definitionPatch);
              res.affectedFiles.forEach(f => affectedFilesSet.add(f));
            }
          }
        }
        break;
      }

      case "TYPE_FIELD_REMOVE": {
        if (request.removeFieldName) {
          const res = this.typePlanner.planFieldRemoval(def, request.removeFieldName, impact.allCandidateFiles);
          if (!res.valid) {
            status = "BREAKING_CHANGE";
            blockedReasons.push(res.blockedReason || "Type field removal failed.");
          } else {
            if (res.definitionPatch) rawPatches.push(res.definitionPatch);
            res.affectedFiles.forEach(f => affectedFilesSet.add(f));
          }
        }
        break;
      }

      default:
        status = "ANALYSIS_INCOMPLETE";
        blockedReasons.push(`Unsupported operation: ${operation}`);
    }

    if (status !== "READY") {
      return this.createEmptyPlan(operation, targetSymbol, relSource, status, blockedReasons);
    }

    return this.finalizePlan(
      operation,
      targetSymbol,
      relSource,
      [...affectedFilesSet].sort(),
      rawPatches,
      status,
      blockedReasons,
      impact.testFiles
    );
  }

  // ── Finalizer & Hashes ────────────────────────────────────────────────────────

  private finalizePlan(
    operation: any,
    targetSymbol: string,
    sourceFile: string,
    affectedFiles: string[],
    rawPatches: AstPatchOperation[],
    status: AdvancedRefactoringStatus,
    blockedReasons: string[],
    testFiles: string[] = []
  ): AdvancedRefactoringPlan {
    // Group operations by file and sort DESCENDING by startPos
    const fileMap = new Map<string, AstPatchOperation[]>();
    for (const op of rawPatches) {
      if (!fileMap.has(op.filePath)) fileMap.set(op.filePath, []);
      fileMap.get(op.filePath)!.push(op);
    }

    const patchOperations: { filePath: string; operations: AstPatchOperation[] }[] = [];
    for (const filePath of [...fileMap.keys()].sort()) {
      const ops = fileMap.get(filePath)!;
      ops.sort((a, b) => b.startPos - a.startPos);
      patchOperations.push({ filePath, operations: ops });
    }

    const planHash = this.computePlanHash(operation, targetSymbol, sourceFile, affectedFiles, status);
    const patchHash = this.computePatchHash(patchOperations);

    return {
      operation,
      targetSymbol,
      sourceFile,
      affectedFiles,
      affectedSymbols: [targetSymbol],
      requiredCallSites: rawPatches.length,
      requiredComponents: 1,
      requiredTests: testFiles,
      patchOperations,
      conflicts: [],
      riskLevel: affectedFiles.length > 5 ? "HIGH" : affectedFiles.length > 2 ? "MEDIUM" : "LOW",
      blockedReasons,
      planHash,
      patchHash,
      status,
    };
  }

  private computePlanHash(
    operation: string,
    targetSymbol: string,
    sourceFile: string,
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
      targetSymbol,
      sourceFile,
      affectedFiles,
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
    operation: any,
    targetSymbol: string,
    sourceFile: string,
    status: AdvancedRefactoringStatus,
    blockedReasons: string[],
    conflicts: string[] = []
  ): AdvancedRefactoringPlan {
    return {
      operation,
      targetSymbol,
      sourceFile,
      affectedFiles: [sourceFile],
      affectedSymbols: [targetSymbol],
      requiredCallSites: 0,
      requiredComponents: 0,
      requiredTests: [],
      patchOperations: [],
      conflicts,
      riskLevel: "BLOCKED",
      blockedReasons,
      planHash: "0".repeat(64),
      patchHash: "0".repeat(64),
      status,
    };
  }
}
