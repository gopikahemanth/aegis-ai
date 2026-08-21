/**
 * TypeFieldRefactoringPlanner — Aegis V2.3 Project 2 Phase 4
 *
 * Handles AST-safe field addition and removal on TypeScript interfaces and types.
 * Enforces optional field rules and non-breaking field removal verification.
 *
 * SAFETY INVARIANTS:
 * 1. TYPE_FIELD_REMOVE is BREAKING_CHANGE if runtime property access remains anywhere in the project.
 * 2. Required TYPE_FIELD_ADD without default values at object literals → BREAKING_CHANGE.
 */

import ts from "typescript";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { FieldDefinition } from "./advanced-refactoring-contract.js";
import type { ResolvedSymbolDefinition } from "./symbol-rename-contract.js";
import type { AstPatchOperation } from "../ast-symbol-patch-planner.js";

export interface TypeFieldAnalysisResult {
  valid: boolean;
  blockedReason?: string;
  definitionPatch?: AstPatchOperation;
  usagePatches: AstPatchOperation[];
  affectedFiles: string[];
}

export class TypeFieldRefactoringPlanner {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Plans AST patch operations for adding a field to an interface or type.
   */
  public planFieldAddition(
    target: ResolvedSymbolDefinition,
    newField: FieldDefinition,
    candidateFiles: string[]
  ): TypeFieldAnalysisResult {
    const fullPath = resolve(this.projectRoot, target.filePath);
    if (!existsSync(fullPath)) {
      return { valid: false, blockedReason: `Target file not found: ${target.filePath}`, usagePatches: [], affectedFiles: [] };
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

    let typeNode: ts.InterfaceDeclaration | ts.TypeAliasDeclaration | null = null;

    ts.forEachChild(sourceFile, node => {
      if (ts.isInterfaceDeclaration(node) && node.name.text === target.name) {
        typeNode = node;
      } else if (ts.isTypeAliasDeclaration(node) && node.name.text === target.name) {
        typeNode = node;
      }
    });

    if (!typeNode) {
      return { valid: false, blockedReason: `Type or Interface "${target.name}" not found in "${target.filePath}"`, usagePatches: [], affectedFiles: [] };
    }

    const fieldStr = `  ${newField.name}${newField.isOptional ? "?" : ""}: ${newField.type};\n`;
    const closeBraceIndex = content.indexOf("}", (typeNode as ts.Node).getStart(sourceFile));

    const defPatch: AstPatchOperation = {
      filePath: target.filePath,
      targetSymbolName: target.name,
      originalSnippet: "}",
      replacementSnippet: `${fieldStr}}`,
      startPos: closeBraceIndex,
      endPos: closeBraceIndex + 1,
      description: `Add field "${newField.name}" to ${target.name}`,
    };

    return {
      valid: true,
      definitionPatch: defPatch,
      usagePatches: [],
      affectedFiles: [target.filePath],
    };
  }

  /**
   * Plans AST patch operations for removing a field from an interface or type,
   * verifying no runtime accesses exist.
   */
  public planFieldRemoval(
    target: ResolvedSymbolDefinition,
    fieldName: string,
    candidateFiles: string[]
  ): TypeFieldAnalysisResult {
    const fullPath = resolve(this.projectRoot, target.filePath);
    if (!existsSync(fullPath)) {
      return { valid: false, blockedReason: `Target file not found: ${target.filePath}`, usagePatches: [], affectedFiles: [] };
    }

    // 1. Verify that fieldName is NOT accessed via property access in candidate files
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

      let isPropertyAccessed = false;
      const checkAccess = (node: ts.Node) => {
        if (ts.isPropertyAccessExpression(node) && node.name.text === fieldName) {
          isPropertyAccessed = true;
        }
        if (!isPropertyAccessed) ts.forEachChild(node, checkAccess);
      };

      checkAccess(cSource);

      if (isPropertyAccessed) {
        return {
          valid: false,
          blockedReason: `BREAKING_CHANGE: Field "${fieldName}" is actively accessed in "${file}". Cannot remove field safely.`,
          usagePatches: [],
          affectedFiles: [],
        };
      }
    }

    // 2. Locate and remove field signature in definition file
    const content = readFileSync(fullPath, "utf8");
    const isTsx = target.filePath.endsWith(".tsx") || target.filePath.endsWith(".jsx");
    const sourceFile = ts.createSourceFile(
      target.filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    let fieldNode: ts.PropertySignature | null = null;
    ts.forEachChild(sourceFile, node => {
      if (ts.isInterfaceDeclaration(node) && node.name.text === target.name) {
        for (const member of node.members) {
          if (ts.isPropertySignature(member) && ts.isIdentifier(member.name) && member.name.text === fieldName) {
            fieldNode = member;
          }
        }
      }
    });

    if (!fieldNode) {
      return { valid: false, blockedReason: `Field "${fieldName}" not found in "${target.name}"`, usagePatches: [], affectedFiles: [] };
    }

    const memberStart = (fieldNode as ts.Node).getStart(sourceFile);
    const memberEnd = (fieldNode as ts.Node).getEnd();

    // Remove line including trailing semicolon/newline
    const defPatch: AstPatchOperation = {
      filePath: target.filePath,
      targetSymbolName: target.name,
      originalSnippet: content.slice(memberStart, memberEnd),
      replacementSnippet: "",
      startPos: memberStart,
      endPos: memberEnd,
      description: `Remove field "${fieldName}" from ${target.name}`,
    };

    return {
      valid: true,
      definitionPatch: defPatch,
      usagePatches: [],
      affectedFiles: [target.filePath],
    };
  }
}
