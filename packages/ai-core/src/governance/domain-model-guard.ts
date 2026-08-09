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
 * Example: A Resume Scanner contract locks [User, Submission, AnalysisResult, Keyword].
 * If the planner generates a task that creates a "Task" or "Item" model,
 * DomainModelGuard will reject it with UNAUTHORIZED_DOMAIN_MODEL.
 */
export class DomainModelGuard {
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
      // No contract models defined — skip guard
      return { valid: true, violations: [] };
    }

    const allowedNormalized = new Set(
      requiredModels.map(m => m.toLowerCase().replace(/[^a-z]/g, ""))
    );

    // Model creation patterns in task text
    const modelPatterns = [
      /create\s+(?:a\s+)?(\w+)\s+model/gi,
      /define\s+(?:a\s+)?(\w+)\s+(?:schema|model|entity|table)/gi,
      /(\w+)\s+prisma\s+model/gi,
      /model\s+(\w+)\s*\{/gi,
      /implement\s+(\w+)\s+(?:crud|repository|service)/gi,
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
            reason: `UNAUTHORIZED_DOMAIN_MODEL: Task introduces "${forbidden}" which is not in contract.requiredModels [${requiredModels.join(", ")}]`,
          });
        }
      }

      // Check task-specific model extraction
      for (const pattern of modelPatterns) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(taskText)) !== null) {
          const modelName = match[1].toLowerCase().replace(/[^a-z]/g, "");
          if (
            modelName.length > 2 &&
            !allowedNormalized.has(modelName) &&
            !["the", "new", "all", "this", "that", "from", "with"].includes(modelName)
          ) {
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
   * Filter out tasks that violate the domain model contract.
   * Logs violations but does NOT throw — removes offending tasks and continues.
   * Used when planner regeneration still produces violations after retries.
   */
  public static filterTasks(tasks: Task[], requiredModels: string[]): Task[] {
    const result = DomainModelGuard.validate(tasks, requiredModels);
    if (result.valid) return tasks;

    const forbiddenTaskIds = new Set(result.violations.map(v => v.taskId));
    const filtered = tasks.filter(t => !forbiddenTaskIds.has(String(t.id)));

    console.warn(
      `[DomainModelGuard] ⚠️ Stripped ${forbiddenTaskIds.size} unauthorized task(s) from plan. ` +
      `Continuing with ${filtered.length} valid task(s).`
    );

    return filtered;
  }
}
