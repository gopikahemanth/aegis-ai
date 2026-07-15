import { ExecutionStage } from "../execution/stage.js";

import type { AIProvider } from "../providers/base.js";
import type { ProjectSpecification } from "../architect/specification.js";
import type { Task } from "./task.js";
import { JsonExtractor } from "../utils/json-extractor.js";
export class TaskPlanner {
  private readonly extractor =
  new JsonExtractor();
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

Break the project into execution tasks.

Each task MUST contain:

Each task MUST contain:

- id
- title
- description
- completed
- stage
- priority
- dependencies
- estimatedComplexity

Valid stages are ONLY:

- Requirements
- Architecture
- Implementation
- Review
- Validation
- Healing

Return ONLY valid JSON.

Example:
[
  {
    "id": 1,
    "title": "Create authentication",
    "description": "Implement authentication module",
    "completed": false,
    "stage": "Implementation",
    "priority": 1,
    "dependencies": [],
    "estimatedComplexity": 2
  },
  {
    "id": 2,
    "title": "Create dashboard",
    "description": "Implement dashboard",
    "completed": false,
    "stage": "Implementation",
    "priority": 2,
    "dependencies": [1],
    "estimatedComplexity": 4
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

console.log("========== RAW RESPONSE ==========");
console.log(response);

const json =
  this.extractor.extract(response);

console.log("========== EXTRACTED JSON ==========");
console.log(json);
console.log("===================================");

const tasks =
  JSON.parse(json) as Task[];

    return tasks.map(
      (task) => ({
        ...task,
        stage:
          ExecutionStage[
            task.stage as keyof typeof ExecutionStage
          ] ??
          ExecutionStage.Implementation,
      }),
    );
  }
}
