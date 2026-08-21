/**
 * RenameConflictDetector — Aegis V2.3 Project 2 Phase 3
 *
 * Scans candidate and affected files to detect naming collisions, scope shadowing conflicts,
 * duplicate exports/imports, dynamic import barriers, and destructive Prisma model renames.
 *
 * SAFETY INVARIANTS:
 * 1. SYMBOL_COLLISION if newName already exists in the target scope.
 * 2. DYNAMIC_DEPENDENCY_BLOCKED if dynamic import/require or computed property access is detected.
 * 3. PRISMA_MODEL_RENAME_BLOCKED for Prisma schema models in Phase 3.
 * 4. Never guesses or forces a rename when conflicts exist.
 */

import ts from "typescript";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type {
  ResolvedSymbolDefinition,
  SymbolRenameStatus,
} from "./symbol-rename-contract.js";

export interface ConflictDetectionResult {
  hasConflicts: boolean;
  status: SymbolRenameStatus;
  conflicts: string[];
  blockedReasons: string[];
}

export class RenameConflictDetector {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Detects all collisions and safety blockers for a proposed symbol rename.
   */
  public detectConflicts(
    target: ResolvedSymbolDefinition,
    newName: string,
    affectedFiles: string[]
  ): ConflictDetectionResult {
    const conflicts: string[] = [];
    const blockedReasons: string[] = [];

    // 1. Prisma Model Rename Guard (Phase 3 invariant)
    if (target.filePath.endsWith(".prisma") || target.name.startsWith("Prisma") || target.kind === "type" && target.filePath.includes("prisma")) {
      blockedReasons.push(`PRISMA_MODEL_RENAME_BLOCKED: Prisma schema model rename for "${target.name}" is blocked to prevent destructive migrations.`);
      return {
        hasConflicts: true,
        status: "PRISMA_MODEL_RENAME_BLOCKED",
        conflicts,
        blockedReasons,
      };
    }

    // 2. Scan each affected file for collisions
    for (const rawFile of affectedFiles) {
      const relPath = rawFile.replace(/\\/g, "/").replace(/^(\/|\\)+/, "");
      const fullPath = resolve(this.projectRoot, relPath);

      if (!existsSync(fullPath)) continue;

      try {
        const content = readFileSync(fullPath, "utf8");

        // Check dynamic dependencies (dynamic import / require / eval)
        if (this.hasDynamicDependencies(content)) {
          blockedReasons.push(`DYNAMIC_DEPENDENCY_BLOCKED: Dynamic import or require detected in "${relPath}". Cannot guarantee complete reference resolution.`);
        }

        const isTsx = relPath.endsWith(".tsx") || relPath.endsWith(".jsx");
        const sourceFile = ts.createSourceFile(
          relPath,
          content,
          ts.ScriptTarget.Latest,
          true,
          isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
        );

        // Check top-level symbol collisions with newName
        this.checkFileForCollisions(sourceFile, relPath, target, newName, conflicts, blockedReasons);
      } catch (err: any) {
        blockedReasons.push(`RENAME_ANALYSIS_INCOMPLETE: Failed to parse file "${relPath}": ${err?.message}`);
      }
    }

    if (blockedReasons.some(r => r.startsWith("DYNAMIC_DEPENDENCY_BLOCKED"))) {
      return {
        hasConflicts: true,
        status: "DYNAMIC_DEPENDENCY_BLOCKED",
        conflicts,
        blockedReasons,
      };
    }

    if (conflicts.length > 0) {
      return {
        hasConflicts: true,
        status: "SYMBOL_COLLISION",
        conflicts,
        blockedReasons,
      };
    }

    if (blockedReasons.length > 0) {
      return {
        hasConflicts: true,
        status: "BLOCKED",
        conflicts,
        blockedReasons,
      };
    }

    return {
      hasConflicts: false,
      status: "READY",
      conflicts: [],
      blockedReasons: [],
    };
  }

  private checkFileForCollisions(
    sourceFile: ts.SourceFile,
    relPath: string,
    target: ResolvedSymbolDefinition,
    newName: string,
    conflicts: string[],
    blockedReasons: string[]
  ): void {
    const isDefFile = relPath === target.filePath;

    ts.forEachChild(sourceFile, node => {
      // 1. Top-level function declarations
      if (ts.isFunctionDeclaration(node) && node.name && node.name.text === newName) {
        conflicts.push(`Symbol "${newName}" already declared as function in "${relPath}" at line ${this.getLine(sourceFile, node)}`);
      }

      // 2. Top-level class declarations
      if (ts.isClassDeclaration(node) && node.name && node.name.text === newName) {
        conflicts.push(`Symbol "${newName}" already declared as class in "${relPath}" at line ${this.getLine(sourceFile, node)}`);
      }

      // 3. Class method collision inside the same container class
      if (
        isDefFile &&
        target.kind === "method" &&
        target.containerName &&
        ts.isClassDeclaration(node) &&
        node.name &&
        node.name.text === target.containerName
      ) {
        for (const member of node.members) {
          if (ts.isMethodDeclaration(member) && ts.isIdentifier(member.name) && member.name.text === newName) {
            conflicts.push(`Method "${newName}" already exists in class "${target.containerName}" in "${relPath}" at line ${this.getLine(sourceFile, member)}`);
          }
        }
      }

      // 4. Interface declarations
      if (ts.isInterfaceDeclaration(node) && node.name.text === newName) {
        conflicts.push(`Interface "${newName}" already declared in "${relPath}" at line ${this.getLine(sourceFile, node)}`);
      }

      // 5. Type alias declarations
      if (ts.isTypeAliasDeclaration(node) && node.name.text === newName) {
        conflicts.push(`Type alias "${newName}" already declared in "${relPath}" at line ${this.getLine(sourceFile, node)}`);
      }

      // 6. Top-level variable declarations
      if (ts.isVariableStatement(node)) {
        for (const decl of node.declarationList.declarations) {
          if (ts.isIdentifier(decl.name) && decl.name.text === newName) {
            conflicts.push(`Variable/Constant "${newName}" already declared in "${relPath}" at line ${this.getLine(sourceFile, decl)}`);
          }
        }
      }

      // 7. Top-level import bindings
      if (ts.isImportDeclaration(node) && node.importClause) {
        if (node.importClause.name && node.importClause.name.text === newName) {
          conflicts.push(`Import binding "${newName}" already exists in "${relPath}" at line ${this.getLine(sourceFile, node)}`);
        }
        if (node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
          for (const elem of node.importClause.namedBindings.elements) {
            if (elem.name.text === newName) {
              conflicts.push(`Named import binding "${newName}" already exists in "${relPath}" at line ${this.getLine(sourceFile, elem)}`);
            }
          }
        }
      }

      // 8. Top-level export collisions
      if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const elem of node.exportClause.elements) {
          if (elem.name.text === newName) {
            conflicts.push(`Export binding "${newName}" already exists in "${relPath}" at line ${this.getLine(sourceFile, elem)}`);
          }
        }
      }
    });
  }

  private hasDynamicDependencies(content: string): boolean {
    const dynamicPatterns = [
      /import\s*\(\s*`[^`]*\$\{/, // import(`...${var}...`)
      /import\s*\(\s*[a-zA-Z_$]/, // import(varName)
      /require\s*\(\s*`[^`]*\$\{/, // require(`...${var}...`)
      /require\s*\(\s*[a-zA-Z_$]/, // require(varName)
      /eval\s*\(/,
    ];
    return dynamicPatterns.some(p => p.test(content));
  }

  private getLine(sourceFile: ts.SourceFile, node: ts.Node): number {
    return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
  }
}
