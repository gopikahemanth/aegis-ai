import type { AIProvider } from "../providers/base.js";
import type { ProjectSpecification } from "../architect/specification.js";
import type { Task } from "./task.js";

export class TaskPlanner {
  constructor(
    private readonly provider: AIProvider,
  ) {}

  async plan(
    specification: ProjectSpecification,
  ): Promise<Task[]> {

    const response =
      await this.provider.chat([
        {
          role: "system",
          content: `
You are a senior software architect.

Break the project into implementation tasks.

Return ONLY valid JSON.

Example:

[
  {
    "id": 1,
    "title": "Create React application",
    "description": "Initialize the frontend project",
    "completed": false
  }
]
`,
        },
        {
          role: "user",
          content: JSON.stringify(
            specification,
            null,
            2,
          ),
        },
      ]);

    return JSON.parse(response);
  }
}
