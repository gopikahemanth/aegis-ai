/**
 * ASTSymbolPatchPlanner
 *
 * Converts requested existing-symbol modifications into exact AST-local patch operations,
 * ensuring bit-for-bit preservation of surrounding code, comments, and formatting.
 * Validates patch-plan convergence against the closed ImpactSet.
 */

import ts from "typescript";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ImpactClosureResult } from "./impact-closure-engine.js";

export type PatchPlanValidationStatus =
  | "CLOSED_AND_CONVERGENT"
  | "MISSING_IMPACTED_FILE"
  | "UNAUTHORIZED_FILE_IN_PATCH"
  | "PATCH_TARGET_INVALID"
  | "IMPACT_SET_NOT_CLOSED";

export interface AstPatchOperation {
  filePath: string;
  targetSymbolName: string;
  originalSnippet: string;
  replacementSnippet: string;
  startPos: number;
  endPos: number;
  description: string;
}

export interface SymbolPatchPlan {
  status: PatchPlanValidationStatus;
  targetSymbol: string;
  definitionFile: string;
  impactedFiles: string[];
  plannedFiles: string[];
  patches: AstPatchOperation[];
  validationError?: string;
}

export class ASTSymbolPatchPlanner {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Validates whether the planned patch files match the required impact closure exactly.
   */
  public static validatePatchPlan(
    impactClosure: ImpactClosureResult,
    plannedFilePaths: string[]
  ): { status: PatchPlanValidationStatus; error?: string } {
    if (impactClosure.status !== "CLOSED") {
      return {
        status: "IMPACT_SET_NOT_CLOSED",
        error: "ABORT: Impact closure status is not CLOSED. Cannot safely plan patches.",
      };
    }

    const requiredFiles = new Set<string>([
      ...impactClosure.mustChange,
      ...impactClosure.mayChange,
    ]);

    const plannedFiles = new Set<string>(plannedFilePaths.map(p => p.replace(/\\/g, "/").replace(/^(\/|\\)+/, "")));

    // 1. Check for missing required files
    for (const req of requiredFiles) {
      if (!plannedFiles.has(req)) {
        return {
          status: "MISSING_IMPACTED_FILE",
          error: `MISSING_IMPACTED_FILE: Required impacted file "${req}" is missing from patch plan.`,
        };
      }
    }

    // 2. Check for unauthorized extra files
    for (const plan of plannedFiles) {
      if (!requiredFiles.has(plan)) {
        return {
          status: "UNAUTHORIZED_FILE_IN_PATCH",
          error: `UNAUTHORIZED_FILE_IN_PATCH: File "${plan}" is not in the required impact closure set.`,
        };
      }
    }

    return { status: "CLOSED_AND_CONVERGENT" };
  }

  /**
   * Plans an AST-local function or method body update in the definition file.
   */
  public planFunctionUpdate(
    filePath: string,
    functionName: string,
    newBodyOrSignature: (originalNodeText: string, node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.VariableDeclaration) => string,
    description: string = `Update ${functionName}`
  ): AstPatchOperation | null {
    const relPath = this.toRelative(filePath);
    const fullPath = resolve(this.projectRoot, relPath);
    if (!existsSync(fullPath)) return null;

    const content = readFileSync(fullPath, "utf8");
    const sourceFile = ts.createSourceFile(
      relPath,
      content,
      ts.ScriptTarget.Latest,
      true,
      relPath.endsWith(".tsx") || relPath.endsWith(".jsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    let targetOp: AstPatchOperation | null = null;

    const visit = (node: ts.Node) => {
      if (targetOp) return;

      if (ts.isFunctionDeclaration(node) && node.name && node.name.text === functionName) {
        const start = node.getStart(sourceFile);
        const end = node.getEnd();
        const originalSnippet = content.slice(start, end);
        const replacementSnippet = newBodyOrSignature(originalSnippet, node);

        targetOp = {
          filePath: relPath,
          targetSymbolName: functionName,
          originalSnippet,
          replacementSnippet,
          startPos: start,
          endPos: end,
          description,
        };
        return;
      }

      if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === functionName) {
        const start = node.getStart(sourceFile);
        const end = node.getEnd();
        const originalSnippet = content.slice(start, end);
        const replacementSnippet = newBodyOrSignature(originalSnippet, node);

        targetOp = {
          filePath: relPath,
          targetSymbolName: functionName,
          originalSnippet,
          replacementSnippet,
          startPos: start,
          endPos: end,
          description,
        };
        return;
      }

      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === functionName) {
        const start = node.getStart(sourceFile);
        const end = node.getEnd();
        const originalSnippet = content.slice(start, end);
        const replacementSnippet = newBodyOrSignature(originalSnippet, node);

        targetOp = {
          filePath: relPath,
          targetSymbolName: functionName,
          originalSnippet,
          replacementSnippet,
          startPos: start,
          endPos: end,
          description,
        };
        return;
      }

      if (ts.isTypeAliasDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === functionName) {
        const start = node.getStart(sourceFile);
        const end = node.getEnd();
        const originalSnippet = content.slice(start, end);
        const replacementSnippet = newBodyOrSignature(originalSnippet, node as any);

        targetOp = {
          filePath: relPath,
          targetSymbolName: functionName,
          originalSnippet,
          replacementSnippet,
          startPos: start,
          endPos: end,
          description,
        };
        return;
      }

      if (ts.isInterfaceDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === functionName) {
        const start = node.getStart(sourceFile);
        const end = node.getEnd();
        const originalSnippet = content.slice(start, end);
        const replacementSnippet = newBodyOrSignature(originalSnippet, node as any);

        targetOp = {
          filePath: relPath,
          targetSymbolName: functionName,
          originalSnippet,
          replacementSnippet,
          startPos: start,
          endPos: end,
          description,
        };
        return;
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return targetOp;
  }

  /**
   * Plans an AST-local call-site update in a caller file (e.g. updating arguments or component props).
   */
  public planCallSiteUpdate(
    callerFilePath: string,
    calleeSymbolName: string,
    transformCallNode: (originalCallText: string, node: ts.CallExpression | ts.JsxOpeningElement | ts.JsxSelfClosingElement) => string,
    description: string = `Update call sites of ${calleeSymbolName}`
  ): AstPatchOperation[] {
    const relPath = this.toRelative(callerFilePath);
    const fullPath = resolve(this.projectRoot, relPath);
    if (!existsSync(fullPath)) return [];

    const content = readFileSync(fullPath, "utf8");
    const sourceFile = ts.createSourceFile(
      relPath,
      content,
      ts.ScriptTarget.Latest,
      true,
      relPath.endsWith(".tsx") || relPath.endsWith(".jsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    const ops: AstPatchOperation[] = [];

    const visit = (node: ts.Node) => {
      // Call Expressions: fn(a, b) or Service.fn(a, b)
      if (ts.isCallExpression(node)) {
        const exprText = node.expression.getText(sourceFile);
        if (exprText === calleeSymbolName || exprText.endsWith(`.${calleeSymbolName}`)) {
          const start = node.getStart(sourceFile);
          const end = node.getEnd();
          const originalSnippet = content.slice(start, end);
          const replacementSnippet = transformCallNode(originalSnippet, node);

          ops.push({
            filePath: relPath,
            targetSymbolName: calleeSymbolName,
            originalSnippet,
            replacementSnippet,
            startPos: start,
            endPos: end,
            description,
          });
        }
      }

      // JSX Component Usages: <Component prop={val} />
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tagName = node.tagName.getText(sourceFile);
        if (tagName === calleeSymbolName) {
          const start = node.getStart(sourceFile);
          const end = node.getEnd();
          const originalSnippet = content.slice(start, end);
          const replacementSnippet = transformCallNode(originalSnippet, node);

          ops.push({
            filePath: relPath,
            targetSymbolName: calleeSymbolName,
            originalSnippet,
            replacementSnippet,
            startPos: start,
            endPos: end,
            description,
          });
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return ops;
  }

  /**
   * Applies AST patch operations to a file's content in reverse offset order
   * to guarantee zero line/character drift.
   */
  public static applyPatchesToContent(content: string, operations: AstPatchOperation[]): string {
    // Sort descending by startPos to apply from bottom to top
    const sorted = [...operations].sort((a, b) => b.startPos - a.startPos);

    let result = content;
    for (const op of sorted) {
      const before = result.slice(0, op.startPos);
      const after = result.slice(op.endPos);
      result = before + op.replacementSnippet + after;
    }

    return result;
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
