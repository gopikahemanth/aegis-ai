/**
 * PublicApiCompatibilityVerifier — Aegis V2.3 Project 2 Phase 6
 *
 * Verifies that structural refactorings do not inadvertently break public package APIs:
 * - Checks entry points (src/index.ts, index.ts, src/public-api.ts)
 * - Detects removed or un-re-exported public symbols
 * - Flags unannounced breaking changes with PUBLIC_API_BREAK
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import type { StructuralRefactoringPlan } from "./structural-refactoring-contract.js";

export interface PublicApiValidationResult {
  isPublicApi: boolean;
  isBreaking: boolean;
  status: "PASSED" | "PUBLIC_API_BREAK";
  issues: string[];
  warnings: string[];
}

export class PublicApiCompatibilityVerifier {
  private readonly projectRoot: string;
  private readonly entryPoints = ["src/index.ts", "src/index.tsx", "src/index.js", "index.ts", "index.js", "src/public-api.ts"];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Evaluates if a plan introduces breaking changes to public package entry points.
   */
  public verifyPlan(plan: StructuralRefactoringPlan, allowBreaking = false): PublicApiValidationResult {
    const issues: string[] = [];
    const warnings: string[] = [];
    let isPublicApi = false;
    let isBreaking = false;

    // Check if source file is a package entry point
    const cleanSource = plan.sourceFile.replace(/\\/g, "/").replace(/^(\/|\\)+/, "");
    if (this.entryPoints.some(ep => cleanSource.endsWith(ep) || cleanSource === ep)) {
      isPublicApi = true;
    }

    // Check all entry points in project to see if any export the moved/removed symbols
    for (const ep of this.entryPoints) {
      const fullEp = resolve(this.projectRoot, ep);
      if (!existsSync(fullEp)) continue;

      const content = readFileSync(fullEp, "utf8");
      const sf = ts.createSourceFile(ep, content, ts.ScriptTarget.Latest, true);

      const symbolNames = plan.symbols ? plan.symbols.map(s => s.name) : plan.sourceSymbol ? [plan.sourceSymbol.name] : [];

      for (const symName of symbolNames) {
        if (content.includes(symName)) {
          isPublicApi = true;
          // Check if re-export exists in plan patch operations
          const hasReExport = plan.patchOperations.some(
            op => op.operationKind === "INSERT_EXPORT" || (op.operationKind === "UPDATE_EXPORT" && op.replacement.includes(symName))
          );

          if (!hasReExport && !allowBreaking) {
            isBreaking = true;
            issues.push(`Public symbol "${symName}" in "${ep}" was moved/removed without a backward-compatible re-export bridge.`);
          } else {
            warnings.push(`Public symbol "${symName}" in "${ep}" has been modified.`);
          }
        }
      }
    }

    return {
      isPublicApi,
      isBreaking,
      status: isBreaking ? "PUBLIC_API_BREAK" : "PASSED",
      issues,
      warnings,
    };
  }
}
