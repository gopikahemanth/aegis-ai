import { ExecutionStage } from "./stage.js";

import type { StageRunner } from "./stage-runner.js";
import type { TaskContext } from "./task-context.js";
import type { TaskResult } from "./task-result.js";
import type { ExecutionTask } from "./execution-loop.js";

export class RequirementsRunner
  implements StageRunner {

  async run(
    context: TaskContext,
    task: ExecutionTask,
  ): Promise<TaskResult> {

    console.log();

    console.log(
      `[${ExecutionStage.Requirements}] ${task.title}`,
    );

    return {
      taskId: task.id,
      success: true,
      message: "Requirements completed.",
    };
  }
}
