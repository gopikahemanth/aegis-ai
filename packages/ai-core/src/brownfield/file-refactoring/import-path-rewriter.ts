/**
 * ImportPathRewriter — Aegis V2.3 Project 2 Phase 5
 *
 * Computes exact relative and aliased module specifiers when files are renamed or moved.
 * Generates AST-local patch operations for import declarations, export declarations,
 * and internal imports within the moved file.
 */

import ts from "typescript";
import { dirname, relative, normalize } from "node:path";
import type { AstPatchOperation } from "../ast-symbol-patch-planner.js";
import type { FileImportReference } from "./file-refactoring-contract.js";

export class ImportPathRewriter {
  /**
   * Computes the new module specifier for an import from `importerPath` to `targetPath`.
   */
  public static computeRelativeSpecifier(
    importerPath: string,
    targetPath: string,
    originalSpecifier: string
  ): string {
    const importerDir = dirname(importerPath.replace(/\\/g, "/"));
    const cleanTarget = targetPath.replace(/\\/g, "/");

    let rel = relative(importerDir, cleanTarget).replace(/\\/g, "/");
    if (!rel.startsWith(".")) {
      rel = "./" + rel;
    }

    // Preserve extension conventions:
    // If original specifier ended with .js, replace target extension (.ts/.tsx) with .js
    // If original specifier had no extension, strip extension
    if (originalSpecifier.endsWith(".js")) {
      rel = rel.replace(/\.(ts|tsx|jsx|js)$/, ".js");
    } else if (originalSpecifier.endsWith(".ts") || originalSpecifier.endsWith(".tsx")) {
      // keep extension as is
    } else if (originalSpecifier.startsWith("@/")) {
      // If alias was used, update alias path
      rel = "@/" + cleanTarget.replace(/^src\//, "").replace(/\.(ts|tsx|js|jsx)$/, "");
    } else {
      // Strip extension
      rel = rel.replace(/\.(ts|tsx|js|jsx)$/, "");
    }

    return rel;
  }

  /**
   * Rewrites an import or export AST string literal node.
   */
  public static createImportPatch(
    importerPath: string,
    node: ts.StringLiteral,
    newSpecifier: string,
    sourceFile: ts.SourceFile,
    description?: string
  ): AstPatchOperation {
    const startPos = node.getStart(sourceFile);
    const endPos = node.getEnd();
    const originalSnippet = node.getText(sourceFile);
    const quote = originalSnippet[0] === "'" ? "'" : '"';
    const replacementSnippet = `${quote}${newSpecifier}${quote}`;

    return {
      filePath: importerPath,
      targetSymbolName: "import_specifier",
      originalSnippet,
      replacementSnippet,
      startPos,
      endPos,
      description: description || `Rewrite import path to "${newSpecifier}"`,
    };
  }
}
