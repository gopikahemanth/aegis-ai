import type { PlanStep } from "../agent/planner.js";
import type { ProjectSpecification } from "../architect/specification.js";
import type { GeneratedFile } from "../writer/writer.js";
import type { TaskResult } from "./task-result.js";
import type { ExecutionStage } from "./stage.js";
import type { CoderAgent } from "../agents/coder-agent.js";

export interface TaskContext {
  request: string;
  outputDirectory: string;

  plan?: PlanStep[];

  specification?: ProjectSpecification;

  architecturePlan?: string;

  generatedFiles?: GeneratedFile[];

  results?: TaskResult[];

  currentStage?: ExecutionStage;

  coder?: CoderAgent;

architecture?: ProjectSpecification;
}
