import { AgentExecutor } from "../executor/agent-executor.js";
import { AgentStep } from "../steps/agent-step.js";

import { GenerateAction } from "./generate-action.js";
import { ReviewAction } from "./review-action.js";

import type { Orchestrator } from "@aegis/ai-core";

export class ActionRegistry {

  register(
    executor: AgentExecutor,
    orchestrator: Orchestrator,
  ) {

    const generate =
      new GenerateAction(
        orchestrator,
      );

    const review =
      new ReviewAction();

    executor.register(
      AgentStep.GENERATE,
      (state) => generate.execute(state),
    );

    executor.register(
      AgentStep.REVIEW,
      (state) => review.execute(state),
    );
  }
}
