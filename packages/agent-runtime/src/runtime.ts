import { AgentLoop } from "./loop.js";

import { WorkspaceScanner } from "@aegis/workspace";
import { Orchestrator } from "@aegis/ai-core";
import { AgentExecutor } from "./executor/agent-executor.js";
import { ActionRegistry } from "./actions/action-registry.js";
import { StateFactory } from "./state/state-factory.js";

export class AgentRuntime {
private readonly executor =
  new AgentExecutor();

private readonly loop =
  new AgentLoop(
    this.executor,
  );

  private readonly scanner =
    new WorkspaceScanner();

private readonly registry =
  new ActionRegistry();

private readonly stateFactory =
  new StateFactory();

  constructor(
    private readonly orchestrator: Orchestrator,
  ) {

  }

  async start() {
    console.log("=== Aegis AI Runtime ===");

this.registry.register(
  this.executor,
  this.orchestrator,
);

    const workspace =
      this.scanner.scan(process.cwd());

    console.log(workspace);

const state =
  this.stateFactory.create(
    "Create a modern landing page with HTML, CSS and JavaScript. Separate every file.",
    "./generated/runtime-demo",
  );
   await this.loop.run(
  state,
);
  }
}
