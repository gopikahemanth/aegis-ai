import type { AgentState } from "./state/agent-state.js";

import { AgentStep } from "./steps/agent-step.js";
import { AgentExecutor } from "./executor/agent-executor.js";

import { WorkflowEngine } from "./workflow/workflow-engine.js";

export class AgentLoop {

  private readonly workflow =
    new WorkflowEngine();

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

    const result =
      await this.executor.execute(
        currentState.currentStep,
        currentState,
      );

    currentState =
      result.state;

    if (currentState.completed) {
      break;
    }

    currentState = {
      ...currentState,
      currentStep:
        this.workflow.next(
          currentState.currentStep,
          result.success,
        ),
    };

    if (
      currentState.currentStep ===
      AgentStep.FINISHED
    ) {
      currentState = {
        ...currentState,
        completed: true,
      };
    }
  }

  return currentState;
}
}
