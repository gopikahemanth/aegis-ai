import type { Task } from "./task.js";
import type { AIProvider } from "../providers/base.js";

export class TaskExecutor {
  constructor(
    private readonly provider: AIProvider,
  ) {}

  async execute(
    task: Task,
    projectContext: string,
  ): Promise<string> {
    return this.provider.chat([
      {
        role: "system",
        content: `
You are Aegis AI.

Complete exactly ONE software task.

Only implement the requested task.

Return updated files only.

Format:

===FILE: path===
...
`,
      },
      {
        role: "user",
        content: `
Task:

${task.title}

Description:

${task.description}

Project:

${projectContext}
`,
      },
    ]);
  }
}
