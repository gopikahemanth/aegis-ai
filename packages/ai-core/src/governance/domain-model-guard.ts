import { Task } from "../planner/task.js";

export interface DomainModelViolation {
  taskId: string;
  taskTitle: string;
  forbiddenModel: string;
  reason: string;
}

export interface DomainModelGuardResult {
  valid: boolean;
  violations: DomainModelViolation[];
}

/**
 * DomainModelGuard
 *
 * Validates that CoderAgent tasks do not introduce domain models that
 * are not part of the locked architecture contract.
 *
 * Example: A Resume Scanner contract locks [User, Resume, JobDescription, AnalysisResult].
 * If the planner generates a task that creates a "Task" or "ShoppingCart" model,
 * DomainModelGuard will reject it with UNAUTHORIZED_DOMAIN_MODEL.
 */
export class DomainModelGuard {
  // Explicit technology & infrastructure vocabulary blacklist (MUST NEVER BE EXTRACTIONS AS DOMAIN MODELS)
  private static readonly TECH_BLACKLIST = new Set([
    "postgresql",
    "postgres",
    "mysql",
    "sqlite",
    "mongodb",
    "mongo",
    "prisma",
    "drizzle",
    "mongoose",
    "express",
    "react",
    "react-vite",
    "vite",
    "nextjs",
    "next",
    "next-auth",
    "jwt",
    "typescript",
    "javascript",
    "node",
    "backend",
    "frontend",
    "database",
    "api",
    "server",
    "client",
    "middleware",
    "router",
    "controller",
    "service",
    "library",
    "framework",
    "the",
    "new",
    "all",
    "this",
    "that",
    "from",
    "with",
    "schema",
    "model",
    "entity",
    "table",
    "auth",
  ]);

  // Generic template models that pollute domain-specific apps
  private static readonly ALWAYS_FORBIDDEN = new Set([
    "todoitem",
    "todo",
    "kanbancard",
    "kanbancolumn",
    "shoppingcart",
    "cartitem",
    "blogpost",
    "article",
    "comment",
    "notification",
    "subscription",
  ]);

  // Domain model terminology mapping (e.g. ResumeScan -> AnalysisResult)
  private static readonly MODEL_ALIASES: Record<string, string> = {
    resumescan: "analysisresult",
    scanresult: "analysisresult",
    scan: "analysisresult",
  };

  /**
   * Validate tasks against the contract's required models.
   * @param tasks - Planned tasks from the planner
   * @param requiredModels - Domain models locked by the architecture contract
   */
  public static validate(
    tasks: Task[],
    requiredModels: string[]
  ): DomainModelGuardResult {
    const violations: DomainModelViolation[] = [];

    if (!requiredModels || requiredModels.length === 0) {
      return { valid: true, violations: [] };
    }

    const allowedNormalized = new Set(
      requiredModels.map(m => m.toLowerCase().replace(/[^a-z]/g, ""))
    );

    // Also allow mapped aliases of required models
    for (const [alias, canonical] of Object.entries(DomainModelGuard.MODEL_ALIASES)) {
      if (allowedNormalized.has(canonical)) {
        allowedNormalized.add(alias);
      }
    }

    const modelPatterns = [
      /create\s+(?:a\s+)?(\w+)\s+model/gi,
      /define\s+(?:a\s+)?(\w+)\s+(?:schema|entity|table)/gi,
      /model\s+(\w+)\s*\{/gi,
    ];

    for (const task of tasks) {
      const taskText = `${task.title} ${task.description || ""}`.toLowerCase();
      const taskIdStr = String(task.id);

      // Check always-forbidden models
      for (const forbidden of DomainModelGuard.ALWAYS_FORBIDDEN) {
        if (taskText.includes(forbidden) && !allowedNormalized.has(forbidden)) {
          violations.push({
            taskId: taskIdStr,
            taskTitle: task.title,
            forbiddenModel: forbidden,
            reason: `UNAUTHORIZED_DOMAIN_MODEL: Task introduces generic model "${forbidden}" which is not in contract.requiredModels [${requiredModels.join(", ")}]`,
          });
        }
      }

      // Check model extraction patterns
      for (const pattern of modelPatterns) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(taskText)) !== null) {
          const rawMatch = match[1].toLowerCase().replace(/[^a-z]/g, "");

          // Ignore technology vocabulary blacklist
          if (DomainModelGuard.TECH_BLACKLIST.has(rawMatch) || rawMatch.length <= 2) {
            continue;
          }

          if (!allowedNormalized.has(rawMatch)) {
            violations.push({
              taskId: taskIdStr,
              taskTitle: task.title,
              forbiddenModel: match[1],
              reason: `UNAUTHORIZED_DOMAIN_MODEL: Task introduces model "${match[1]}" not in contract.requiredModels [${requiredModels.join(", ")}]`,
            });
          }
        }
      }
    }

    // Deduplicate violations by taskId+model
    const seen = new Set<string>();
    const unique = violations.filter(v => {
      const key = `${v.taskId}:${v.forbiddenModel}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (unique.length > 0) {
      console.error(`[DomainModelGuard] ❌ ${unique.length} unauthorized domain model violation(s):`);
      unique.forEach(v => console.error(`  • Task #${v.taskId} "${v.taskTitle}": ${v.reason}`));
    } else {
      console.log(`[DomainModelGuard] ✓ All tasks conform to locked domain model: [${requiredModels.join(", ")}]`);
    }

    return { valid: unique.length === 0, violations: unique };
  }

  /**
   * Normalize task text to replace aliases (e.g. ResumeScan -> AnalysisResult)
   * and remove invalid model references WITHOUT stripping the entire task.
   */
  public static filterTasks(tasks: Task[], requiredModels: string[]): Task[] {
    const allowedNormalized = new Set(
      requiredModels.map(m => m.toLowerCase().replace(/[^a-z]/g, ""))
    );

    return tasks.map(task => {
      let title = task.title;
      let description = task.description || "";

      // Replace generic ScanResult -> AnalysisResult or Scan
      title = title
        .replace(/ScanResult/g, "AnalysisResult")
        .replace(/scanresult/gi, "AnalysisResult");
      description = description
        .replace(/ScanResult/g, "AnalysisResult")
        .replace(/scanresult/gi, "AnalysisResult");

      return {
        ...task,
        title,
        description,
      };
    });
  }
}
