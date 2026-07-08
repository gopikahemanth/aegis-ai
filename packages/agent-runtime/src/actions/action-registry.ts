import { AgentExecutor } from "../executor/agent-executor.js";
import { AgentStep } from "../steps/agent-step.js";

import { GenerateAction } from "./generate-action.js";
import { ReviewAction } from "./review-action.js";
import { ValidateAction } from "./validate-action.js";
import { WriteAction } from "./write-action.js";
import { InstallAction } from "./install-action.js";
import { BuildAction } from "./build-action.js";
import { HealAction } from "./heal-action.js";
import { SelfHealer } from "@aegis/ai-core";
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

    const validate =
  new ValidateAction();

 const write =
  new WriteAction();

  const install =
  new InstallAction();

  const build =
  new BuildAction();
const healer =
  new SelfHealer(
    orchestrator.getProvider(),
  );

const heal =
  new HealAction(
    healer,
  );

    executor.register(
      AgentStep.GENERATE,
      (state) => generate.execute(state),
    );

    executor.register(
      AgentStep.REVIEW,
      (state) => review.execute(state),
    );

    executor.register(
  AgentStep.VALIDATE,
  (state) =>
    validate.execute(state),
);
executor.register(
  AgentStep.WRITE,
  (state) =>
    write.execute(state),
);
executor.register(
  AgentStep.INSTALL,
  (state) =>
    install.execute(state),
);

executor.register(
  AgentStep.BUILD,
  (state) =>
    build.execute(state),
);

executor.register(
  AgentStep.HEAL,
  (state) =>
    heal.execute(state),
);
  }
}
