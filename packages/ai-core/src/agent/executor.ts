import { Planner } from "./planner.js";
import { Memory } from "./memory.js";
import { SYSTEM_PROMPT } from "./prompts.js";

import type { AIProvider } from "../providers/base.js";

export class Executor {
  private planner = new Planner();
  private memory = new Memory();

  constructor(private readonly provider: AIProvider) {}

  async execute(request: string) {
    const plan = this.planner.createPlan(request);

    this.memory.add(request);

    const messages = [
      {
        role: "system" as const,
        content: SYSTEM_PROMPT,
      },
      {
        role: "user" as const,
        content: `
Current Request:
${request}

Execution Plan:
${plan.map(step => `- ${step.title}`).join("\n")}
`,
      },
    ];

    const response = await this.provider.chat(messages);

    return {
      request,
      plan,
      memory: this.memory.getAll(),
      response,
    };
  }
}
