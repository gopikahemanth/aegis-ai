import {
  ExecutionStage,
} from "./stage.js";

import type { StageRunner } from "./stage-runner.js";
import type { TaskContext } from "./task-context.js";
import type { TaskResult } from "./task-result.js";
import type { ExecutionTask } from "./execution-loop.js";

export class ImplementationRunner
  implements StageRunner {

  async run(
  context: TaskContext,
  task: ExecutionTask,
): Promise<TaskResult> {

  console.log();

  console.log(
    `[${ExecutionStage.Implementation}] ${task.title}`,
  );

  if (!context.request && !context.coder) {
    return {
      taskId: task.id,
      success: true,
      message: "Execution context initialized.",
    };
  }

  // CoderAgent integration begins here.
  // The actual generation call will be added next.

  return {
    taskId: task.id,
    success: true,
    message: "Implementation completed.",
  };
}
}
