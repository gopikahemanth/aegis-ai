import { ExecutionStage } from "./stage.js";

import type { ExecutionTask } from "./execution-loop.js";

export class StageResolver {
  resolve(
    task: ExecutionTask,
  ): ExecutionStage {

    if (task.stage) {
      return task.stage;
    }

    return ExecutionStage.Implementation;
  }
}
