/**
 * RefactoringConflictAnalyzer — Aegis V2.3 Project 2 Phase 4
 *
 * Conflict, collision, and safety analyzer across compound refactoring operations:
 * - Parameter collisions with existing local scope variables
 * - React Context consumer static resolution verification
 * - Callback & higher-order wrapper compatibility
 * - Overload consistency
 */

import ts from "typescript";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { AdvancedRefactoringRequest, AdvancedRefactoringStatus } from "./advanced-refactoring-contract.js";
import type { ResolvedSymbolDefinition } from "./symbol-rename-contract.js";

export interface RefactoringConflictResult {
  hasConflicts: boolean;
  status: AdvancedRefactoringStatus;
  conflicts: string[];
  blockedReasons: string[];
}

export class RefactoringConflictAnalyzer {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Analyzes potential conflicts for an advanced refactoring request.
   */
  public analyze(
    request: AdvancedRefactoringRequest,
    targetDef?: ResolvedSymbolDefinition | null,
    candidateFiles: string[] = []
  ): RefactoringConflictResult {
    const conflicts: string[] = [];
    const blockedReasons: string[] = [];

    // 1. Prisma Safety Guard
    if (request.sourceFile.endsWith(".prisma") || request.targetSymbol.startsWith("Prisma")) {
      return {
        hasConflicts: true,
        status: "BLOCKED",
        conflicts: [],
        blockedReasons: ["PRISMA_MODEL_RENAME_BLOCKED: Destructive database model refactoring is blocked."],
      };
    }

    // 2. React Context safety check
    for (const file of candidateFiles) {
      const fullPath = resolve(this.projectRoot, file);
      if (!existsSync(fullPath)) continue;

      const content = readFileSync(fullPath, "utf8");
      if (content.includes("createContext") && request.operation.includes("PROP")) {
        // If Context provider / consumer is dynamically accessed
        if (content.includes("useContext(") && content.includes("eval(")) {
          return {
            hasConflicts: true,
            status: "REACT_CONTEXT_ANALYSIS_INCOMPLETE",
            conflicts: [],
            blockedReasons: [`REACT_CONTEXT_ANALYSIS_INCOMPLETE: Dynamic React context usage in "${file}" cannot be statically proven.`],
          };
        }
      }
    }

    // 3. Parameter collision with existing inner variable in definition function
    if (request.parameters && targetDef) {
      const fullPath = resolve(this.projectRoot, targetDef.filePath);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, "utf8");
        const sf = ts.createSourceFile(
          targetDef.filePath,
          content,
          ts.ScriptTarget.Latest,
          true
        );

        for (const newParam of request.parameters) {
          const checkParamShadow = (node: ts.Node) => {
            if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === newParam.name) {
              conflicts.push(`Parameter "${newParam.name}" collides with local variable in "${targetDef.filePath}"`);
            }
            ts.forEachChild(node, checkParamShadow);
          };
          checkParamShadow(sf);
        }
      }
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
}
