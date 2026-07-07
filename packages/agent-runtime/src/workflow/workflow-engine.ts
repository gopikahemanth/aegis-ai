import { AgentStep } from "../steps/agent-step.js";

import {
  workflowDefinition,
} from "./workflow-definition.js";

export class WorkflowEngine {

  next(
    current: AgentStep,
    success = true,
  ): AgentStep {

    const transition =
      workflowDefinition[current];

    if (!transition) {
      return AgentStep.FINISHED;
    }

    if (!success && transition.onFailure) {
      return transition.onFailure;
    }

    return transition.onSuccess;
  }
}
