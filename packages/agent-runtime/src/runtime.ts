import { AgentLoop } from "./loop.js";

import { WorkspaceScanner } from "@aegis/workspace";
import { Orchestrator } from "@aegis/ai-core";
import { AgentExecutor } from "./executor/agent-executor.js";
import { AgentStep } from "./steps/agent-step.js";
import { GenerateAction } from "./actions/generate-action.js";
import { ReviewAction } from "./actions/review-action.js";

export class AgentRuntime {
private readonly executor =
  new AgentExecutor();

private readonly loop =
  new AgentLoop(
    this.executor,
  );

  private readonly scanner =
    new WorkspaceScanner();


  private readonly generateAction: GenerateAction;

  private readonly reviewAction =
  new ReviewAction();

  constructor(
    private readonly orchestrator: Orchestrator,
  ) {
    this.generateAction =
      new GenerateAction(
        orchestrator,
      );
  }

  async start() {
    console.log("=== Aegis AI Runtime ===");

   this.executor.register(
  AgentStep.GENERATE,
  (state) =>
    this.generateAction.execute(state),
);

this.executor.register(
  AgentStep.REVIEW,
  (state) =>
    this.reviewAction.execute(state),
);

    const workspace =
      this.scanner.scan(process.cwd());

    console.log(workspace);


const state = {
  request:
    "Create a modern landing page with HTML, CSS and JavaScript. Separate every file.",

  projectPath:
    "./generated/runtime-demo",

  currentStep:
    AgentStep.GENERATE,

  reviewPassed: false,

  buildPassed: false,

  testPassed: false,

  deployCompleted: false,

  healAttempts: 0,

  completed: false,
};
   await this.loop.run(
  state,
);
  }
}
