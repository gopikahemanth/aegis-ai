/**
 * ServiceContractPlanner — Aegis V2.3 Project 2 Phase 6
 *
 * Coordinates service method contract changes:
 * - Service method parameter updates
 * - Controller call site propagation
 * - Route handlers & test suite updates
 */

import ts from "typescript";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ContractDefinition } from "./contract-refactoring-contract.js";
import type { AstPatchOperation } from "../ast-symbol-patch-planner.js";

export interface ServiceContractPatchResult {
  valid: boolean;
  blockedReason?: string;
  patches: AstPatchOperation[];
  affectedFiles: string[];
}

export class ServiceContractPlanner {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Plans service method parameter addition across service, controllers, and tests.
   */
  public planParameterAddition(
    contract: ContractDefinition,
    param: { name: string; type: string; defaultValue?: string; isOptional?: boolean },
    candidateFiles: string[]
  ): ServiceContractPatchResult {
    const patches: AstPatchOperation[] = [];
    const affectedFilesSet = new Set<string>([contract.filePath]);

    // 1. Patch definition file
    const defPath = resolve(this.projectRoot, contract.filePath);
    if (existsSync(defPath)) {
      const defContent = readFileSync(defPath, "utf8");
      const isTsx = contract.filePath.endsWith(".tsx") || contract.filePath.endsWith(".jsx");
      const sf = ts.createSourceFile(
        contract.filePath,
        defContent,
        ts.ScriptTarget.Latest,
        true,
        isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );

      ts.forEachChild(sf, node => {
        if (
          (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) &&
          node.name &&
          ts.isIdentifier(node.name) &&
          node.name.text === contract.symbolName
        ) {
          const paramStr = `${param.name}${param.isOptional ? "?" : ""}: ${param.type}${param.defaultValue ? ` = ${param.defaultValue}` : ""}`;
          const closeParenIndex = defContent.indexOf(")", node.getStart(sf));

          const originalParams = node.parameters;
          const replacement = originalParams.length > 0 ? `, ${paramStr})` : `${paramStr})`;

          patches.push({
            filePath: contract.filePath,
            targetSymbolName: contract.symbolName,
            originalSnippet: ")",
            replacementSnippet: replacement,
            startPos: closeParenIndex,
            endPos: closeParenIndex + 1,
            description: `Add parameter "${param.name}" to service method ${contract.symbolName}`,
          });
        }
      });
    }

    // 2. Patch calling files (controllers, routes, tests)
    for (const file of candidateFiles) {
      if (file === contract.filePath) continue;
      const fullPath = resolve(this.projectRoot, file);
      if (!existsSync(fullPath)) continue;

      const content = readFileSync(fullPath, "utf8");
      const isTsx = file.endsWith(".tsx") || file.endsWith(".jsx");
      const sf = ts.createSourceFile(
        file,
        content,
        ts.ScriptTarget.Latest,
        true,
        isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );

      const visit = (node: ts.Node) => {
        if (ts.isCallExpression(node)) {
          let callIdent: ts.Identifier | null = null;
          if (ts.isIdentifier(node.expression)) {
            callIdent = node.expression;
          } else if (ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.name)) {
            callIdent = node.expression.name;
          }

          if (callIdent && callIdent.text === contract.symbolName) {
            const args = node.arguments;
            const defaultArg = param.defaultValue || "undefined";

            if (args.length > 0) {
              const lastArg = args[args.length - 1];
              patches.push({
                filePath: file,
                targetSymbolName: contract.symbolName,
                originalSnippet: content.slice(lastArg.getStart(sf), lastArg.getEnd()),
                replacementSnippet: `${content.slice(lastArg.getStart(sf), lastArg.getEnd())}, ${defaultArg}`,
                startPos: lastArg.getStart(sf),
                endPos: lastArg.getEnd(),
                description: `Pass argument "${defaultArg}" for "${param.name}" in call to ${contract.symbolName}`,
              });
            } else {
              const closeParenIndex = content.indexOf(")", node.getStart(sf));
              patches.push({
                filePath: file,
                targetSymbolName: contract.symbolName,
                originalSnippet: ")",
                replacementSnippet: `${defaultArg})`,
                startPos: closeParenIndex,
                endPos: closeParenIndex + 1,
                description: `Pass argument "${defaultArg}" for "${param.name}" in call to ${contract.symbolName}`,
              });
            }
            affectedFilesSet.add(file);
          }
        }
        ts.forEachChild(node, visit);
      };

      visit(sf);
    }

    return {
      valid: true,
      patches,
      affectedFiles: [...affectedFilesSet].sort(),
    };
  }
}
