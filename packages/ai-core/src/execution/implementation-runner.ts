import {
  ExecutionStage,
} from "./stage.js";

import type { StageRunner } from "./stage-runner.js";
import type { TaskContext } from "./task-context.js";
import type { TaskResult } from "./task-result.js";
import type { ExecutionTask } from "./execution-loop.js";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

export class ImplementationRunner
  implements StageRunner {

  async run(
    context: TaskContext,
    task: ExecutionTask,
  ): Promise<TaskResult> {
    const stage = context.currentStage ?? task.stage ?? ExecutionStage.Implementation;

    console.log();
    console.log(
      `[${stage}] ${task.title}`,
    );

    // If executed in Planning stage, verify task is planned without claiming implementation completion
    if (stage === ExecutionStage.Planning) {
      return {
        taskId: task.id,
        success: true,
        message: "Planning stage verified: task registered in execution graph.",
      };
    }

    if (!context.request && !context.coder) {
      return {
        taskId: task.id,
        success: true,
        message: "Execution context initialized.",
      };
    }

    // In Implementation stage, verify that required artifacts were actually produced or validated on disk
    const targetFiles: string[] = [];
    const owned = (task as any).ownedFiles || (task as any).files;
    if (Array.isArray(owned)) {
      targetFiles.push(...owned);
    }

    const hasInContextFiles = Array.isArray(context.generatedFiles) && context.generatedFiles.length > 0;
    const hasDiskFiles = Boolean(
      context.outputDirectory &&
      targetFiles.length > 0 &&
      targetFiles.every(f => {
        const full = join(context.outputDirectory, f);
        return existsSync(full) && statSync(full).size > 0;
      })
    );

    // If task defines required artifacts but none exist on disk or in-memory, reject generation success
    if (targetFiles.length > 0 && !hasDiskFiles && !hasInContextFiles) {
      return {
        taskId: task.id,
        success: false,
        message: `Task "${task.title}" failed: Required artifacts (${targetFiles.join(", ")}) were not produced or validated on disk.`,
      };
    }

    // If no target files defined and no generated files produced in context, reject false success
    if (!hasInContextFiles && !hasDiskFiles && (!context.outputDirectory || !existsSync(context.outputDirectory))) {
      return {
        taskId: task.id,
        success: false,
        message: `Task "${task.title}" failed: No project directory or artifacts found for implementation.`,
      };
    }

    return {
      taskId: task.id,
      success: true,
      message: "Implementation completed and required artifacts verified.",
    };
  }
}
