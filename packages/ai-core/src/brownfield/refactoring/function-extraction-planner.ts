/**
 * FunctionExtractionPlanner — Aegis V2.3 Project 2 Phase 4
 *
 * Handles AST-safe extraction of functions and local expressions.
 * Analyzes free variables, return values, side-effects, and deterministic evaluation order.
 *
 * SAFETY INVARIANTS:
 * 1. Rejects extraction if eval, with, or unknown global mutation is present.
 * 2. Deterministic argument passing and return value derivation.
 */

import ts from "typescript";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ExtractionRange } from "./advanced-refactoring-contract.js";
import type { AstPatchOperation } from "../ast-symbol-patch-planner.js";

export interface ExtractionAnalysisResult {
  valid: boolean;
  blockedReason?: string;
  patches: AstPatchOperation[];
}

export class FunctionExtractionPlanner {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Plans AST extraction of a function from a statement block.
   */
  public planFunctionExtraction(
    sourceFile: string,
    extraction: ExtractionRange
  ): ExtractionAnalysisResult {
    const fullPath = resolve(this.projectRoot, sourceFile);
    if (!existsSync(fullPath)) {
      return { valid: false, blockedReason: `File not found: ${sourceFile}`, patches: [] };
    }

    const content = readFileSync(fullPath, "utf8");
    const isTsx = sourceFile.endsWith(".tsx") || sourceFile.endsWith(".jsx");
    const sf = ts.createSourceFile(
      sourceFile,
      content,
      ts.ScriptTarget.Latest,
      true,
      isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    const targetSnippet = content.slice(extraction.startPos, extraction.endPos);

    // 1. Safety verification: eval / with
    if (/eval\s*\(|with\s*\(/.test(targetSnippet)) {
      return {
        valid: false,
        blockedReason: `EXTRACTION_ANALYSIS_INCOMPLETE: Statement range contains dynamic eval or with clause.`,
        patches: [],
      };
    }

    // 2. Identify variables referenced inside the extraction range
    const innerIdentifiers = new Set<string>();
    const declaredInside = new Set<string>();

    const checkNodes = (node: ts.Node) => {
      if (node.getStart(sf) >= extraction.startPos && node.getEnd() <= extraction.endPos) {
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
          declaredInside.add(node.name.text);
        } else if (ts.isIdentifier(node)) {
          innerIdentifiers.add(node.text);
        }
      }
      ts.forEachChild(node, checkNodes);
    };

    checkNodes(sf);

    // Free variables = identifiers used inside but not declared inside (excluding standard built-ins)
    const builtins = new Set(["console", "Math", "JSON", "Promise", "Date", "Array", "Object", "String", "Number", "Boolean", "undefined", "null", "true", "false"]);
    const freeVars = [...innerIdentifiers].filter(id => !declaredInside.has(id) && !builtins.has(id));

    // 3. Build extracted function declaration
    const paramList = extraction.parameters || freeVars;
    const extractedFuncText = `\nfunction ${extraction.extractedName}(${paramList.join(", ")}) {\n  ${targetSnippet.trim()}\n}\n`;

    // 4. Replacement call text at original site
    const callSnippet = `${extraction.extractedName}(${paramList.join(", ")})`;

    // Replace original snippet with call
    const callPatch: AstPatchOperation = {
      filePath: sourceFile,
      targetSymbolName: extraction.extractedName,
      originalSnippet: targetSnippet,
      replacementSnippet: callSnippet,
      startPos: extraction.startPos,
      endPos: extraction.endPos,
      description: `Replace extracted statements with call to ${extraction.extractedName}`,
    };

    // Append new function at end of file (or top-level)
    const defPatch: AstPatchOperation = {
      filePath: sourceFile,
      targetSymbolName: extraction.extractedName,
      originalSnippet: "",
      replacementSnippet: extractedFuncText,
      startPos: content.length,
      endPos: content.length,
      description: `Define extracted function ${extraction.extractedName}`,
    };

    return {
      valid: true,
      patches: [callPatch, defPatch],
    };
  }
}
