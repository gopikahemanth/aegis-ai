/**
 * IncrementalGenerator
 *
 * Implements intelligent incremental code generation, file satisfaction checks,
 * artifact caching, and dependency invalidation for AEGIS AI.
 *
 * Prevents redundant LLM calls by reusing valid existing files, cached specifications,
 * design briefs, and site content.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import type { Task } from "../planner/task.js";
import type { GeneratedFile } from "../writer/writer.js";

export interface TaskSatisfactionCheck {
  taskId: number;
  taskTitle: string;
  isSatisfied: boolean;
  reason: string;
  existingFiles: GeneratedFile[];
  missingOrInvalidFiles: string[];
}

export interface IncrementalCacheEntry<T = any> {
  key: string;
  hash: string;
  timestamp: string;
  data: T;
}

export class IncrementalGenerator {
  /**
   * Check whether a task's owned files already exist and satisfy basic completeness.
   * If satisfied, the CoderAgent call can be completely skipped (saving 5,000–15,000 tokens per task).
   */
  public static checkTaskSatisfaction(task: Task, projectRoot: string): TaskSatisfactionCheck {
    const ownedFiles = task.ownedFiles || [];
    if (ownedFiles.length === 0) {
      return {
        taskId: task.id,
        taskTitle: task.title,
        isSatisfied: false,
        reason: "Task declares zero owned files — requires generation.",
        existingFiles: [],
        missingOrInvalidFiles: [],
      };
    }

    const existingFiles: GeneratedFile[] = [];
    const missingOrInvalidFiles: string[] = [];

    for (const relPath of ownedFiles) {
      const fullPath = join(projectRoot, relPath);
      if (!existsSync(fullPath)) {
        missingOrInvalidFiles.push(`${relPath} (missing on disk)`);
        continue;
      }

      try {
        const content = readFileSync(fullPath, "utf8");
        const trimmed = content.trim();

        if (trimmed.length < 30) {
          missingOrInvalidFiles.push(`${relPath} (content too short or placeholder stub)`);
          continue;
        }

        // Fast syntax completeness check: brace and parenthesis balance
        const openBraces = (content.match(/\{/g) || []).length;
        const closeBraces = (content.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
          missingOrInvalidFiles.push(`${relPath} (unbalanced curly braces delta: ${openBraces - closeBraces})`);
          continue;
        }

        const openParens = (content.match(/\(/g) || []).length;
        const closeParens = (content.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
          missingOrInvalidFiles.push(`${relPath} (unbalanced parentheses delta: ${openParens - closeParens})`);
          continue;
        }

        existingFiles.push({
          path: relPath,
          content,
        });
      } catch (readErr: any) {
        missingOrInvalidFiles.push(`${relPath} (read error: ${readErr.message})`);
      }
    }

    const isSatisfied = missingOrInvalidFiles.length === 0 && existingFiles.length === ownedFiles.length;
    const reason = isSatisfied
      ? `All ${ownedFiles.length} owned file(s) exist, are non-empty, and passed structural syntax checks.`
      : `${missingOrInvalidFiles.length}/${ownedFiles.length} owned file(s) missing or incomplete: ${missingOrInvalidFiles.join("; ")}`;

    return {
      taskId: task.id,
      taskTitle: task.title,
      isSatisfied,
      reason,
      existingFiles,
      missingOrInvalidFiles,
    };
  }

  /**
   * Retrieve cached artifact (ProductDiscovery, DesignBrief, ContentStrategy) if available.
   */
  public static getCachedArtifact<T>(projectRoot: string, cacheCategory: string, cacheKey: string): T | null {
    try {
      const cacheDir = join(projectRoot, ".aegis", "cache");
      const keyHash = createHash("sha256").update(`${cacheCategory}::${cacheKey}`).digest("hex").slice(0, 16);
      const cacheFile = join(cacheDir, `${cacheCategory}_${keyHash}.json`);

      if (existsSync(cacheFile)) {
        const entry: IncrementalCacheEntry<T> = JSON.parse(readFileSync(cacheFile, "utf8"));
        return entry.data;
      }
    } catch {}
    return null;
  }

  /**
   * Store cached artifact.
   */
  public static setCachedArtifact<T>(projectRoot: string, cacheCategory: string, cacheKey: string, data: T): void {
    try {
      const cacheDir = join(projectRoot, ".aegis", "cache");
      if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });

      const keyHash = createHash("sha256").update(`${cacheCategory}::${cacheKey}`).digest("hex").slice(0, 16);
      const cacheFile = join(cacheDir, `${cacheCategory}_${keyHash}.json`);

      const entry: IncrementalCacheEntry<T> = {
        key: cacheKey,
        hash: keyHash,
        timestamp: new Date().toISOString(),
        data,
      };

      writeFileSync(cacheFile, JSON.stringify(entry, null, 2), "utf8");
    } catch {}
  }

  /**
   * Build targeted, minimal repair context for failing API endpoints in Stage 10.
   * Instead of packaging ALL server routes (30,000+ chars), extracts ONLY the single route file
   * responsible for the failing path.
   */
  public static getTargetedRepairContext(
    outputDirectory: string,
    failingPath: string
  ): { targetRouteFile: string | null; content: string; prismaSnippet: string } {
    const cleanPath = failingPath.replace(/^\/api\//, "").replace(/\/.*$/, "").toLowerCase();
    const serverRoutesDir = join(outputDirectory, "server", "routes");

    let targetRouteFile: string | null = null;
    let content = "";

    if (existsSync(serverRoutesDir)) {
      const candidates = [
        `${cleanPath}Routes.ts`,
        `${cleanPath}.ts`,
        `${cleanPath}Routes.js`,
        `${cleanPath}.js`,
        `${cleanPath}s.ts`,
      ];

      for (const cand of candidates) {
        const full = join(serverRoutesDir, cand);
        if (existsSync(full)) {
          targetRouteFile = `server/routes/${cand}`;
          try {
            content = readFileSync(full, "utf8");
            break;
          } catch {}
        }
      }
    }

    let prismaSnippet = "";
    const prismaPath = join(outputDirectory, "prisma", "schema.prisma");
    if (existsSync(prismaPath)) {
      try {
        const schema = readFileSync(prismaPath, "utf8");
        // Extract only the model related to this route
        const modelRegex = new RegExp(`model\\s+${cleanPath}[^{]*\\{[^}]*\\}`, "i");
        const match = schema.match(modelRegex);
        if (match) {
          prismaSnippet = match[0];
        }
      } catch {}
    }

    return {
      targetRouteFile,
      content,
      prismaSnippet,
    };
  }
}
