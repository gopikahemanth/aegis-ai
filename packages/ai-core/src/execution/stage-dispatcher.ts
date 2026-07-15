import { ExecutionStage } from "./stage.js";

import type { StageRunner } from "./stage-runner.js";

export class StageDispatcher {
  private readonly runners =
    new Map<
      ExecutionStage,
      StageRunner
    >();

  register(
    stage: ExecutionStage,
    runner: StageRunner,
  ) {
    this.runners.set(
      stage,
      runner,
    );
  }

  get(
    stage: ExecutionStage,
  ) {
    return this.runners.get(
      stage,
    );
  }
}
