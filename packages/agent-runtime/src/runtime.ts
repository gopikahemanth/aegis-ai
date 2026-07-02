import { AgentLoop } from "./loop.js";

import { WorkspaceScanner } from "@aegis/workspace";
import { GroqProvider, Orchestrator } from "@aegis/ai-core";

export class AgentRuntime {
  private readonly loop = new AgentLoop();
  private readonly scanner = new WorkspaceScanner();

  async start() {
    console.log("=== Aegis AI Runtime ===");

    const workspace = this.scanner.scan(process.cwd());

    console.log(workspace);

    const provider = new GroqProvider();

    const orchestrator = new Orchestrator(provider);

const result = await orchestrator.generateProject(
  "Create a modern landing page with HTML, CSS and JavaScript. Separate every file.",
  "./generated/runtime-demo"
);

    console.log(result);

    await this.loop.run();
  }
}
