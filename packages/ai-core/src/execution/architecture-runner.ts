import { ExecutionStage } from "./stage.js";

import type { StageRunner } from "./stage-runner.js";
import type { TaskContext } from "./task-context.js";
import type { TaskResult } from "./task-result.js";
import type { ExecutionTask } from "./execution-loop.js";

export class ArchitectureRunner
  implements StageRunner {

  async run(
    context: TaskContext,
    task: ExecutionTask,
  ): Promise<TaskResult> {

    console.log();

    console.log(
      `[${ExecutionStage.Architecture}] ${task.title}`,
    );

    return {
      taskId: task.id,
      success: true,
      message: "Architecture completed.",
    };
  }
}
