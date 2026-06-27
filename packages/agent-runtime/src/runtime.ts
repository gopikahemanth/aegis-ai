import { AgentLoop } from "./loop.js";

export class AgentRuntime {
  private readonly loop = new AgentLoop();

  async start() {
    await this.loop.run();
  }
}
