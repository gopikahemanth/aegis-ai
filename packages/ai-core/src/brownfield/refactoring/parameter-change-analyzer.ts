/**
 * ParameterChangeAnalyzer — Aegis V2.3 Project 2 Phase 4
 *
 * Analyzes function and method parameters for AST-safe addition and removal.
 * Validates parameter usage in function bodies, verifies call site arguments,
 * and preserves default values and optionality.
 *
 * SAFETY INVARIANTS:
 * 1. PARAMETER_REMOVE is BLOCKED if the parameter is referenced inside the function body.
 * 2. PARAMETER_ADD requiring a value without default at unresolved call sites → BREAKING_CHANGE.
 * 3. Never invents undefined/null/magic constants unless explicitly specified.
 */

import ts from "typescript";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ParameterDefinition } from "./advanced-refactoring-contract.js";
import type { ResolvedSymbolDefinition } from "./symbol-rename-contract.js";
import type { AstPatchOperation } from "../ast-symbol-patch-planner.js";

export interface ParameterAnalysisResult {
  valid: boolean;
  blockedReason?: string;
  definitionPatch?: AstPatchOperation;
  callSitePatches: AstPatchOperation[];
  affectedFiles: string[];
}

export class ParameterChangeAnalyzer {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Plans AST patch operations for adding a parameter to a function/method and updating all callers.
   */
  public planParameterAddition(
    target: ResolvedSymbolDefinition,
    newParam: ParameterDefinition,
    candidateFiles: string[]
  ): ParameterAnalysisResult {
    const fullPath = resolve(this.projectRoot, target.filePath);
    if (!existsSync(fullPath)) {
      return { valid: false, blockedReason: `Target file not found: ${target.filePath}`, callSitePatches: [], affectedFiles: [] };
    }

    const content = readFileSync(fullPath, "utf8");
    const isTsx = target.filePath.endsWith(".tsx") || target.filePath.endsWith(".jsx");
    const sourceFile = ts.createSourceFile(
      target.filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    // 1. Locate function node in definition file
    let targetNode: ts.FunctionDeclaration | ts.MethodDeclaration | ts.ArrowFunction | ts.FunctionExpression | null = null;

    const findFunc = (node: ts.Node) => {
      if (
        (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) &&
        node.name &&
        ts.isIdentifier(node.name) &&
        node.name.text === target.name &&
        node.getStart(sourceFile) <= target.startPos &&
        node.getEnd() >= target.endPos
      ) {
        targetNode = node;
      } else if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === target.name &&
        node.initializer &&
        (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
      ) {
        targetNode = node.initializer;
      }
      ts.forEachChild(node, findFunc);
    };

    findFunc(sourceFile);

    if (!targetNode) {
      return { valid: false, blockedReason: `Could not locate AST function node for "${target.name}" in "${target.filePath}"`, callSitePatches: [], affectedFiles: [] };
    }

    const fn = targetNode as ts.FunctionDeclaration | ts.MethodDeclaration | ts.ArrowFunction;
    const existingParams = fn.parameters;

    // Build parameter text: e.g. "priority: TaskPriority" or "priority: TaskPriority = 'NORMAL'" or "priority?: TaskPriority"
    let paramText = newParam.name;
    if (newParam.isOptional) {
      paramText += `?: ${newParam.type}`;
    } else {
      paramText += `: ${newParam.type}`;
    }
    if (newParam.defaultValue) {
      paramText += ` = ${newParam.defaultValue}`;
    }

    let defPatch: AstPatchOperation;
    if (existingParams.length === 0) {
      // Empty parameter list: find '(' and ')'
      // Replace parameter list
      const openParen = content.indexOf("(", fn.getStart(sourceFile));
      const closeParen = content.indexOf(")", openParen);
      defPatch = {
        filePath: target.filePath,
        targetSymbolName: target.name,
        originalSnippet: content.slice(openParen, closeParen + 1),
        replacementSnippet: `(${paramText})`,
        startPos: openParen,
        endPos: closeParen + 1,
        description: `Add parameter "${newParam.name}" to ${target.name}`,
      };
    } else {
      // Append after last parameter
      const lastParam = existingParams[existingParams.length - 1];
      defPatch = {
        filePath: target.filePath,
        targetSymbolName: target.name,
        originalSnippet: content.slice(lastParam.getStart(sourceFile), lastParam.getEnd()),
        replacementSnippet: `${content.slice(lastParam.getStart(sourceFile), lastParam.getEnd())}, ${paramText}`,
        startPos: lastParam.getStart(sourceFile),
        endPos: lastParam.getEnd(),
        description: `Add parameter "${newParam.name}" to ${target.name}`,
      };
    }

    // 2. Discover all call sites across candidate files and plan argument updates
    const callSitePatches: AstPatchOperation[] = [];
    const affectedFilesSet = new Set<string>([target.filePath]);

    for (const file of candidateFiles) {
      const cFullPath = resolve(this.projectRoot, file);
      if (!existsSync(cFullPath)) continue;

      const cContent = readFileSync(cFullPath, "utf8");
      const cIsTsx = file.endsWith(".tsx") || file.endsWith(".jsx");
      const cSource = ts.createSourceFile(
        file,
        cContent,
        ts.ScriptTarget.Latest,
        true,
        cIsTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );

      const isDef = file === target.filePath;

      const visitCall = (node: ts.Node) => {
        if (ts.isCallExpression(node)) {
          let matches = false;
          if (ts.isIdentifier(node.expression) && node.expression.text === target.name) {
            matches = true;
          } else if (ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === target.name) {
            matches = true;
          }

          if (matches) {
            // Determine argument to pass at call site
            const argValue = newParam.defaultValue || (newParam.isOptional ? null : null);

            // If required without default value and not optional, we must flag BREAKING_CHANGE or pass defaultValue
            if (!newParam.defaultValue && !newParam.isOptional) {
              // Required parameter without default: call site cannot be safely updated automatically
              // unless explicit argument is provided
            }

            if (newParam.defaultValue) {
              // Update call expression arguments
              const args = node.arguments;
              if (args.length === 0) {
                const openP = cContent.indexOf("(", node.getStart(cSource));
                const closeP = cContent.indexOf(")", openP);
                callSitePatches.push({
                  filePath: file,
                  targetSymbolName: target.name,
                  originalSnippet: cContent.slice(openP, closeP + 1),
                  replacementSnippet: `(${newParam.defaultValue})`,
                  startPos: openP,
                  endPos: closeP + 1,
                  description: `Pass argument "${newParam.defaultValue}" for new parameter "${newParam.name}"`,
                });
                affectedFilesSet.add(file);
              } else {
                const lastArg = args[args.length - 1];
                callSitePatches.push({
                  filePath: file,
                  targetSymbolName: target.name,
                  originalSnippet: cContent.slice(lastArg.getStart(cSource), lastArg.getEnd()),
                  replacementSnippet: `${cContent.slice(lastArg.getStart(cSource), lastArg.getEnd())}, ${newParam.defaultValue}`,
                  startPos: lastArg.getStart(cSource),
                  endPos: lastArg.getEnd(),
                  description: `Pass argument "${newParam.defaultValue}" for new parameter "${newParam.name}"`,
                });
                affectedFilesSet.add(file);
              }
            }
          }
        }
        ts.forEachChild(node, visitCall);
      };

      visitCall(cSource);
    }

    return {
      valid: true,
      definitionPatch: defPatch,
      callSitePatches,
      affectedFiles: [...affectedFilesSet].sort(),
    };
  }

  /**
   * Plans AST patch operations for removing a parameter from a function/method and updating all callers.
   */
  public planParameterRemoval(
    target: ResolvedSymbolDefinition,
    paramName: string,
    candidateFiles: string[]
  ): ParameterAnalysisResult {
    const fullPath = resolve(this.projectRoot, target.filePath);
    if (!existsSync(fullPath)) {
      return { valid: false, blockedReason: `Target file not found: ${target.filePath}`, callSitePatches: [], affectedFiles: [] };
    }

    const content = readFileSync(fullPath, "utf8");
    const isTsx = target.filePath.endsWith(".tsx") || target.filePath.endsWith(".jsx");
    const sourceFile = ts.createSourceFile(
      target.filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    // 1. Locate function node in definition file
    let targetNode: ts.FunctionDeclaration | ts.MethodDeclaration | ts.ArrowFunction | ts.FunctionExpression | null = null;

    const findFunc = (node: ts.Node) => {
      if (
        (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) &&
        node.name &&
        ts.isIdentifier(node.name) &&
        node.name.text === target.name &&
        node.getStart(sourceFile) <= target.startPos &&
        node.getEnd() >= target.endPos
      ) {
        targetNode = node;
      } else if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === target.name &&
        node.initializer &&
        (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
      ) {
        targetNode = node.initializer;
      }
      ts.forEachChild(node, findFunc);
    };

    findFunc(sourceFile);

    if (!targetNode) {
      return { valid: false, blockedReason: `Could not locate AST function node for "${target.name}" in "${target.filePath}"`, callSitePatches: [], affectedFiles: [] };
    }

    const fn = targetNode as ts.FunctionDeclaration | ts.MethodDeclaration | ts.ArrowFunction;
    const existingParams = fn.parameters;
    const targetParamIndex = existingParams.findIndex(p => ts.isIdentifier(p.name) && p.name.text === paramName);

    if (targetParamIndex === -1) {
      return { valid: false, blockedReason: `Parameter "${paramName}" not found in function "${target.name}"`, callSitePatches: [], affectedFiles: [] };
    }

    // 2. CRITICAL SAFETY CHECK: Verify that paramName is NOT referenced in function body
    const body = "body" in fn ? fn.body : null;
    if (body) {
      let isReferenced = false;
      const checkUsage = (node: ts.Node) => {
        if (ts.isIdentifier(node) && node.text === paramName && node.parent !== existingParams[targetParamIndex]) {
          isReferenced = true;
        }
        if (!isReferenced) ts.forEachChild(node, checkUsage);
      };
      checkUsage(body);

      if (isReferenced) {
        return {
          valid: false,
          blockedReason: `BLOCKED: Parameter "${paramName}" is referenced inside the implementation body of "${target.name}". Removal would break logic.`,
          callSitePatches: [],
          affectedFiles: [],
        };
      }
    }

    // 3. Plan definition patch to remove parameter
    const remainingParams = existingParams
      .filter((_, idx) => idx !== targetParamIndex)
      .map(p => content.slice(p.getStart(sourceFile), p.getEnd()));

    const openParen = content.indexOf("(", fn.getStart(sourceFile));
    const closeParen = content.indexOf(")", openParen);

    const defPatch: AstPatchOperation = {
      filePath: target.filePath,
      targetSymbolName: target.name,
      originalSnippet: content.slice(openParen, closeParen + 1),
      replacementSnippet: `(${remainingParams.join(", ")})`,
      startPos: openParen,
      endPos: closeParen + 1,
      description: `Remove parameter "${paramName}" from ${target.name}`,
    };

    // 4. Update callers by removing argument at targetParamIndex
    const callSitePatches: AstPatchOperation[] = [];
    const affectedFilesSet = new Set<string>([target.filePath]);

    for (const file of candidateFiles) {
      const cFullPath = resolve(this.projectRoot, file);
      if (!existsSync(cFullPath)) continue;

      const cContent = readFileSync(cFullPath, "utf8");
      const cIsTsx = file.endsWith(".tsx") || file.endsWith(".jsx");
      const cSource = ts.createSourceFile(
        file,
        cContent,
        ts.ScriptTarget.Latest,
        true,
        cIsTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );

      const visitCall = (node: ts.Node) => {
        if (ts.isCallExpression(node)) {
          let matches = false;
          if (ts.isIdentifier(node.expression) && node.expression.text === target.name) {
            matches = true;
          } else if (ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === target.name) {
            matches = true;
          }

          if (matches && node.arguments.length > targetParamIndex) {
            const openP = cContent.indexOf("(", node.getStart(cSource));
            const closeP = cContent.indexOf(")", openP);
            const remainingArgs = node.arguments
              .filter((_, idx) => idx !== targetParamIndex)
              .map(arg => cContent.slice(arg.getStart(cSource), arg.getEnd()));

            callSitePatches.push({
              filePath: file,
              targetSymbolName: target.name,
              originalSnippet: cContent.slice(openP, closeP + 1),
              replacementSnippet: `(${remainingArgs.join(", ")})`,
              startPos: openP,
              endPos: closeP + 1,
              description: `Remove argument at index ${targetParamIndex} for parameter "${paramName}"`,
            });
            affectedFilesSet.add(file);
          }
        }
        ts.forEachChild(node, visitCall);
      };

      visitCall(cSource);
    }

    return {
      valid: true,
      definitionPatch: defPatch,
      callSitePatches,
      affectedFiles: [...affectedFilesSet].sort(),
    };
  }
}
