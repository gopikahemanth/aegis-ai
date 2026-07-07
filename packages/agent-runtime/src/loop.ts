import type { AgentState } from "./state/agent-state.js";
import { AgentStep } from "./steps/agent-step.js";
import { AgentExecutor } from "./executor/agent-executor.js";
import { NextStepResolver } from "./loop/next-step-resolver.js";
export class AgentLoop {
  private readonly resolver =
  new NextStepResolver();
  constructor(
    private readonly executor: AgentExecutor,
  ) {}

  async run(
    state: AgentState,
  ): Promise<AgentState> {

    console.log(
      "Agent loop started...",
    );

    let currentState = state;

    while (!currentState.completed) {

     const step =
  this.resolver.resolve(
    currentState,
  );

if (step === AgentStep.FINISHED) {
  currentState = {
    ...currentState,
    completed: true,
  };

  continue;
}

currentState =
  await this.executor.execute(
    step,
    currentState,
  );
    }

    return currentState;
  }
}
