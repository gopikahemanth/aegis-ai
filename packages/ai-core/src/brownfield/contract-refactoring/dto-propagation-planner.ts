/**
 * DTOPropagationPlanner — Aegis V2.3 Project 2 Phase 6
 *
 * Propagates DTO field additions, removals, and renames across the vertical chain:
 * - DTO interfaces
 * - Service & Controller mappers
 * - API Client functions & response types
 * - React Hooks & Components
 */

import ts from "typescript";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ContractDefinition } from "./contract-refactoring-contract.js";
import type { AstPatchOperation } from "../ast-symbol-patch-planner.js";

export interface DTOPatchResult {
  valid: boolean;
  blockedReason?: string;
  patches: AstPatchOperation[];
  affectedFiles: string[];
}

export class DTOPropagationPlanner {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Plans AST patches for renaming a DTO field across all candidate files.
   */
  public planFieldRename(
    contract: ContractDefinition,
    oldFieldName: string,
    newFieldName: string,
    candidateFiles: string[]
  ): DTOPatchResult {
    const patches: AstPatchOperation[] = [];
    const affectedFilesSet = new Set<string>([contract.filePath]);

    for (const file of candidateFiles) {
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
        // 1. DTO / Interface member signature
        if (ts.isPropertySignature(node) && ts.isIdentifier(node.name) && node.name.text === oldFieldName) {
          patches.push({
            filePath: file,
            targetSymbolName: oldFieldName,
            originalSnippet: oldFieldName,
            replacementSnippet: newFieldName,
            startPos: node.name.getStart(sf),
            endPos: node.name.getEnd(),
            description: `Rename DTO field "${oldFieldName}" to "${newFieldName}"`,
          });
          affectedFilesSet.add(file);
        }

        // 2. Property access: obj.category
        if (ts.isPropertyAccessExpression(node) && node.name.text === oldFieldName) {
          patches.push({
            filePath: file,
            targetSymbolName: oldFieldName,
            originalSnippet: oldFieldName,
            replacementSnippet: newFieldName,
            startPos: node.name.getStart(sf),
            endPos: node.name.getEnd(),
            description: `Rename property access "${oldFieldName}" to "${newFieldName}"`,
          });
          affectedFilesSet.add(file);
        }

        // 3. Object literal property assignment: { category: val } or { category }
        if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && node.name.text === oldFieldName) {
          patches.push({
            filePath: file,
            targetSymbolName: oldFieldName,
            originalSnippet: oldFieldName,
            replacementSnippet: newFieldName,
            startPos: node.name.getStart(sf),
            endPos: node.name.getEnd(),
            description: `Rename property assignment "${oldFieldName}" to "${newFieldName}"`,
          });
          affectedFilesSet.add(file);
        }

        // 4. Shorthand property assignment: { category } -> { expenseCategory: category } or { expenseCategory }
        if (ts.isShorthandPropertyAssignment(node) && node.name.text === oldFieldName) {
          patches.push({
            filePath: file,
            targetSymbolName: oldFieldName,
            originalSnippet: oldFieldName,
            replacementSnippet: `${newFieldName}: ${oldFieldName}`,
            startPos: node.name.getStart(sf),
            endPos: node.name.getEnd(),
            description: `Update shorthand property assignment "${oldFieldName}" to "${newFieldName}: ${oldFieldName}"`,
          });
          affectedFilesSet.add(file);
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
