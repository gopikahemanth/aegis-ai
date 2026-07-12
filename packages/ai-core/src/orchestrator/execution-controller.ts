import {
  ExecutionPhase,
} from "./execution-phase.js";

import type {
  ExecutionState,
} from "./execution-state.js";

export class ExecutionController {
  private state: ExecutionState = {
    phase: ExecutionPhase.Requirements,
    startedAt: new Date(),
    completed: false,
  };

  getState() {
    return this.state;
  }

  enter(
    phase: ExecutionPhase,
  ) {
    this.state = {
      ...this.state,
      phase,
    };

    console.log(
      `\n=== ${phase} ===`,
    );
  }

  complete() {
    this.state = {
      ...this.state,
      phase: ExecutionPhase.Complete,
      completed: true,
    };

    console.log(
      "\n=== Complete ===",
    );
  }
}
