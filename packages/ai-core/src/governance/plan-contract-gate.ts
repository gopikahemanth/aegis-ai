import { Task } from "../planner/task.js";
import { CanonicalArchitectureState } from "./canonical-architecture-state.js";
import { ArchitectureContractV1 } from "./architecture-resolver.js";

export interface TaskViolation {
  taskId: string;
  taskTitle: string;
  field: string;
  forbiddenTerm: string;
  context: string;
}

export interface TaskContractResult {
  status: "ACCEPTED" | "REJECTED";
  task: Task;
  violations: TaskViolation[];
}

export interface PlanContractGateResult {
  valid: boolean;
  accepted: Task[];
  rejected: TaskContractResult[];
  invalidTasksCount: number;
  errors: string[];
}

/**
 * PlanContractGate
 *
 * Hard gate that runs BEFORE CoderAgent dispatch.
 * Each task is independently validated against the canonical architecture contract.
 *
 * IMPORTANT: This gate does NOT rewrite task text.
 * If a task contains forbidden technology, it is REJECTED.
 * The orchestrator must regenerate rejected tasks via the planner (max 3 attempts).
 * Only ACCEPTED tasks may reach CoderAgent.
 */
export class PlanContractGate {
  /**
   * Detect all contract violations in a single task.
   * Scans: title, description, libraries, framework, technologies, implementationInstructions.
   * Checks: forbidden technology terms AND architectureHash mismatch.
   */
  public static detectViolations(
    task: Task,
    canonicalState: ReturnType<InstanceType<typeof CanonicalArchitectureState>["getState"]>
  ): TaskViolation[] {
    const violations: TaskViolation[] = [];
    const canonicalHash = canonicalState.architectureHash;
    const forbidden = canonicalState.forbiddenTechnologies;

    // Fields to scan for forbidden tech
    const textFields: { field: string; value: string }[] = [
      { field: "title", value: task.title || "" },
      { field: "description", value: task.description || "" },
      { field: "implementationInstructions", value: (task as any).implementationInstructions || "" },
      { field: "framework", value: (task as any).framework || "" },
    ];

    // Array fields to scan
    const arrayFields: { field: string; values: string[] }[] = [
      { field: "libraries", values: (task as any).libraries || [] },
      { field: "technologies", values: (task as any).technologies || [] },
      { field: "allowedTechnologies", values: task.allowedTechnologies || [] },
    ];

    for (const { field, value } of textFields) {
      for (const term of forbidden) {
        // Use word-boundary aware regex to prevent false positives (e.g. "next" in "nextTick")
        const pattern = new RegExp(
          `(?:^|[\\s,;:\\(\\[\\{/"'])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:[\\s,;:\\)\\]\\}/"']|$)`,
          "gi"
        );
        if (pattern.test(value)) {
          violations.push({
            taskId: String(task.id),
            taskTitle: task.title,
            field,
            forbiddenTerm: term,
            context: value.slice(0, 200),
          });
        }
      }
    }

    for (const { field, values } of arrayFields) {
      for (const val of values) {
        const lower = val.toLowerCase().trim();
        for (const term of forbidden) {
          if (lower.includes(term.toLowerCase())) {
            violations.push({
              taskId: String(task.id),
              taskTitle: task.title,
              field,
              forbiddenTerm: term,
              context: val,
            });
          }
        }
      }
    }

    // Hash check: if LLM supplied an architectureHash that mismatches, it's a violation
    if (task.architectureHash && task.architectureHash !== canonicalHash) {
      violations.push({
        taskId: String(task.id),
        taskTitle: task.title,
        field: "architectureHash",
        forbiddenTerm: task.architectureHash,
        context: `Task hash "${task.architectureHash}" != canonical "${canonicalHash}"`,
      });
    }

    return violations;
  }

  /**
   * Validate and classify all tasks. Returns accepted and rejected sets.
   * Does NOT perform word substitution — rejected tasks must be regenerated.
   */
  public static verify(
    tasks: Task[],
    _contract?: ArchitectureContractV1
  ): PlanContractGateResult {
    const canonicalState = CanonicalArchitectureState.getInstance().getState();
    const canonicalHash = canonicalState.architectureHash;
    const errors: string[] = [];
    const accepted: Task[] = [];
    const rejected: TaskContractResult[] = [];

    for (const task of tasks) {
      const violations = PlanContractGate.detectViolations(task, canonicalState);

      // Always stamp canonical hash — overwrite any LLM-supplied value
      const boundTask: Task = {
        ...task,
        architectureHash: canonicalHash,
        allowedTechnologies: canonicalState.requiredLibraries,
        forbiddenTechnologies: canonicalState.forbiddenTechnologies,
      };

      if (violations.length === 0) {
        console.log(`[TASK-CONTRACT] Task "${task.title}" (#${task.id}): PASS`);
        accepted.push(boundTask);
      } else {
        const summary = violations.map(v => `${v.field}="${v.forbiddenTerm}"`).join(", ");
        console.warn(
          `[TASK-CONTRACT] Task "${task.title}" (#${task.id}): FAIL\n` +
          `  Reason: Forbidden technology detected — ${summary}`
        );
        errors.push(`Task "${task.title}": ${summary}`);
        rejected.push({ status: "REJECTED", task: boundTask, violations });
      }
    }

    console.log(
      `[TASK-CONTRACT] Gate complete — Accepted: ${accepted.length}, Rejected: ${rejected.length} / ${tasks.length} total`
    );

    return {
      valid: rejected.length === 0,
      accepted,
      rejected,
      invalidTasksCount: rejected.length,
      errors,
    };
  }

  /**
   * @deprecated Use verify() instead — this kept for backward compat shim
   */
  public static verifyAndNormalize(
    tasks: Task[],
    contract: ArchitectureContractV1
  ): { valid: boolean; tasks: Task[]; invalidTasksCount: number; rewrittenTasksCount: number; errors: string[] } {
    const result = PlanContractGate.verify(tasks, contract);
    return {
      valid: result.valid,
      tasks: result.accepted,
      invalidTasksCount: result.invalidTasksCount,
      rewrittenTasksCount: 0,
      errors: result.errors,
    };
  }
}
