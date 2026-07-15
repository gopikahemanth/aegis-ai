import type { TaskContext } from "./task-context.js";
import type { TaskResult } from "./task-result.js";
import type { ExecutionTask } from "./execution-loop.js";

export abstract class BaseStageRunner {
  abstract run(
    context: TaskContext,
    task: ExecutionTask,
  ): Promise<TaskResult>;
}
