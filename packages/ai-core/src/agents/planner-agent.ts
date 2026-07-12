import { BaseAgent } from "./base-agent.js";
import { TaskPlanner } from "../planner/index.js";

import type {
  ProjectSpecification,
} from "../architect/specification.js";

import type {
  Task,
} from "../planner/task.js";

export class PlannerAgent extends BaseAgent {
  readonly name = "Planner Agent";

  private readonly planner =
    new TaskPlanner(
      this.provider,
    );

  async execute(
    specification: ProjectSpecification,
  ): Promise<Task[]> {
    return this.planner.plan(
      specification,
    );
  }
}
