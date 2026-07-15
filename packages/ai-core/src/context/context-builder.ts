import type { ProjectSpecification } from "../architect/specification.js";
import type { Task } from "../planner/task.js";

import { ProjectMemory } from "./project-memory.js";

export class ContextBuilder {
  constructor(
    private readonly memory: ProjectMemory,
  ) {}

  build(
    specification: ProjectSpecification,
    task: Task,
  ): string {

    return [
      "# Project Specification",
      JSON.stringify(
        specification,
        null,
        2,
      ),

      "",

      "# Current Task",
      JSON.stringify(
        task,
        null,
        2,
      ),

      "",

      "# Existing Project",
      this.memory.summarize(),
    ].join("\n");
  }
}
