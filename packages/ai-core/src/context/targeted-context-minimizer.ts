/**
 * TargetedContextMinimizer
 *
 * Implements strict minimum-sufficient context selection.
 * Prevents full-repository context dumping and enforces server secret exclusion from frontend prompts.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Task } from "../planner/task.js";
import type { ArchitectureContractV1 } from "../governance/architecture-resolver.js";
import type { DomainContract } from "../governance/domain-contract.js";

export interface MinimizedContextResult {
  taskId: number;
  taskTitle: string;
  contextHeader: string;
  relevantContracts: string;
  filesToRead: Array<{ path: string; content: string; purpose: "OWNED" | "DEPENDENCY" | "CONSUMER" }>;
  excludedSecretsCount: number;
  totalTokensEstimate: number;
}

export class TargetedContextMinimizer {
  private static readonly SECRET_PATTERNS = [
    /DATABASE_URL\s*=\s*["'][^"']+["']/gi,
    /JWT_SECRET\s*=\s*["'][^"']+["']/gi,
    /SECRET_KEY\s*=\s*["'][^"']+["']/gi,
    /API_KEY\s*=\s*["'][^"']+["']/gi,
    /process\.env\.DATABASE_URL/g,
    /process\.env\.JWT_SECRET/g,
  ];

  /**
   * Build targeted, minimum-sufficient context for a specific task.
   */
  public static buildContext(
    task: Task,
    projectPath: string,
    archContract?: ArchitectureContractV1,
    domainContract?: DomainContract
  ): MinimizedContextResult {
    const isFrontend =
      (task.title + " " + task.description).toLowerCase().includes("frontend") ||
      (task.title + " " + task.description).toLowerCase().includes("ui") ||
      (task.title + " " + task.description).toLowerCase().includes("component") ||
      (task.title + " " + task.description).toLowerCase().includes("page") ||
      (task.ownedFiles || []).some(f => f.startsWith("src/"));

    const isBackend =
      (task.title + " " + task.description).toLowerCase().includes("backend") ||
      (task.title + " " + task.description).toLowerCase().includes("api") ||
      (task.title + " " + task.description).toLowerCase().includes("controller") ||
      (task.title + " " + task.description).toLowerCase().includes("route") ||
      (task.ownedFiles || []).some(f => f.startsWith("server/"));

    // 1. Build Relevant Contracts snippet
    let relevantContracts = "";
    if (archContract) {
      if (isFrontend) {
        relevantContracts += `[ARCHITECTURE CONTRACT: FRONTEND]\nFramework: ${archContract.frontend.framework}\nStyling: ${archContract.styling}\nRoutes: ${archContract.requiredRoutes.join(", ")}\n`;
      } else if (isBackend) {
        relevantContracts += `[ARCHITECTURE CONTRACT: BACKEND]\nFramework: ${archContract.backend.framework}\nDatabase: ${archContract.database.provider}\nORM: ${archContract.database.orm}\nAuth: ${archContract.authentication}\n`;
      } else {
        relevantContracts += `[ARCHITECTURE CONTRACT]\nFramework: ${archContract.frontend.framework} + ${archContract.backend.framework}\nDatabase: ${archContract.database.provider}\n`;
      }
    }

    if (domainContract) {
      relevantContracts += `[DOMAIN CONTRACT]\nDomain: "${domainContract.domainName}"\nAllowed Terms: [${domainContract.allowedTerminology.slice(0, 10).join(", ")}]\n`;
    }

    // 2. Collect files strictly relevant to this task
    const filesToRead: MinimizedContextResult["filesToRead"] = [];
    let excludedSecretsCount = 0;

    // Owned files (Priority 4)
    for (const rawPath of task.ownedFiles || []) {
      const path = rawPath.replace(/\\/g, "/");
      const fullPath = join(projectPath, path);
      if (existsSync(fullPath)) {
        try {
          let content = readFileSync(fullPath, "utf8");
          if (isFrontend) {
            const redacted = this.redactSecrets(content);
            content = redacted.text;
            excludedSecretsCount += redacted.redactedCount;
          }
          filesToRead.push({ path, content, purpose: "OWNED" });
        } catch {}
      }
    }

    // Allowed / Dependency files (Priority 5)
    for (const rawPath of task.allowedFiles || []) {
      const path = rawPath.replace(/\\/g, "/");
      // Skip if already added as owned
      if (filesToRead.some(f => f.path === path)) continue;

      // Filter out server secrets and prisma from frontend tasks
      if (isFrontend && (path.includes(".env") || path.includes("prisma/schema.prisma") || path.startsWith("server/"))) {
        excludedSecretsCount++;
        continue;
      }

      // Filter out frontend UI from backend tasks
      if (isBackend && (path.startsWith("src/pages/") || path.startsWith("src/components/"))) {
        continue;
      }

      const fullPath = join(projectPath, path);
      if (existsSync(fullPath)) {
        try {
          let content = readFileSync(fullPath, "utf8");
          if (isFrontend) {
            const redacted = this.redactSecrets(content);
            content = redacted.text;
            excludedSecretsCount += redacted.redactedCount;
          }
          filesToRead.push({ path, content, purpose: "DEPENDENCY" });
        } catch {}
      }
    }

    // 3. Build Header with Acceptance Criteria
    const contextHeader =
      `TASK #${task.id}: ${task.title}\n` +
      `DESCRIPTION: ${task.description}\n` +
      (task.acceptanceCriteria?.length ? `ACCEPTANCE CRITERIA:\n${task.acceptanceCriteria.map(a => `- ${a.description}`).join("\n")}\n` : "") +
      (task.requiredExports?.length ? `REQUIRED EXPORTS: [${task.requiredExports.join(", ")}]\n` : "") +
      (task.requiredImports?.length ? `REQUIRED IMPORTS: [${task.requiredImports.join(", ")}]\n` : "");

    const fullText = `${contextHeader}\n${relevantContracts}\n${filesToRead.map(f => `--- ${f.path} (${f.purpose}) ---\n${f.content}`).join("\n\n")}`;
    const totalTokensEstimate = Math.ceil(fullText.length / 4);

    return {
      taskId: task.id,
      taskTitle: task.title,
      contextHeader,
      relevantContracts,
      filesToRead,
      excludedSecretsCount,
      totalTokensEstimate,
    };
  }

  private static redactSecrets(text: string): { text: string; redactedCount: number } {
    let result = text;
    let redactedCount = 0;

    for (const pattern of this.SECRET_PATTERNS) {
      if (pattern.test(result)) {
        redactedCount++;
        result = result.replace(pattern, "[REDACTED_SERVER_SECRET]");
      }
    }

    return { text: result, redactedCount };
  }
}
