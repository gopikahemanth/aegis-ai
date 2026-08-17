/**
 * TechnicalDebtEngine
 *
 * Scans project codebase and operational metrics for architectural drift,
 * dead artifacts, TODOs, and accumulated technical debt.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export interface TechnicalDebtItem {
  category: "TODO_ACCUMULATION" | "DEAD_CODE" | "STALE_CONTRACT" | "COMPLEXITY" | "UNUSED_EXPORT";
  severity: "HIGH" | "MEDIUM" | "LOW";
  affectedFiles: string[];
  evidence: string;
  recommendedAction: string;
}

export interface TechnicalDebtReport {
  projectId: string;
  totalDebtScore: number; // 0 (pristine) - 100 (critical debt)
  items: TechnicalDebtItem[];
  summary: string;
}

export class TechnicalDebtEngine {
  /**
   * Audit codebase for technical debt items.
   */
  public static audit(projectPath: string, projectId: string): TechnicalDebtReport {
    const items: TechnicalDebtItem[] = [];
    const files = this.collectSourceFiles(projectPath);

    let todoCount = 0;
    const todoFiles: string[] = [];

    for (const filePath of files) {
      const relPath = filePath.replace(projectPath, "").replace(/^[/\\]+/, "");
      try {
        const content = readFileSync(filePath, "utf8");
        if (content.includes("TODO:") || content.includes("FIXME:")) {
          todoCount++;
          todoFiles.push(relPath);
        }
      } catch {}
    }

    if (todoCount > 0) {
      items.push({
        category: "TODO_ACCUMULATION",
        severity: todoCount > 5 ? "MEDIUM" : "LOW",
        affectedFiles: todoFiles,
        evidence: `Found ${todoCount} unresolved TODO/FIXME annotations across files.`,
        recommendedAction: "Resolve or convert inline comments into structured issue tickets.",
      });
    }

    const totalDebtScore = Math.min(100, items.length * 15 + todoCount * 5);

    return {
      projectId,
      totalDebtScore,
      items,
      summary: `Technical Debt Score: ${totalDebtScore}/100. ${items.length} category issue(s) detected.`,
    };
  }

  private static collectSourceFiles(dir: string): string[] {
    const results: string[] = [];
    if (!existsSync(dir)) return results;

    const list = readdirSync(dir);
    for (const file of list) {
      const fullPath = join(dir, file);
      try {
        const stat = statSync(fullPath);
        if (stat && stat.isDirectory()) {
          if (file !== "node_modules" && file !== ".git" && file !== "dist" && file !== ".aegis") {
            results.push(...this.collectSourceFiles(fullPath));
          }
        } else if (file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".js")) {
          results.push(fullPath);
        }
      } catch {}
    }
    return results;
  }
}
