import type { ExecutionStage } from "../execution/stage.js";

export interface Task {
  id: number;

  title: string;

  description: string;

  completed: boolean;

  stage?: ExecutionStage;

  priority?: number;

  dependencies?: number[];

  estimatedComplexity?: number;

  status?:
    | "pending"
    | "running"
    | "completed"
    | "failed";

  architectureHash?: string;
  allowedTechnologies?: string[];
  forbiddenTechnologies?: string[];
  allowedPaths?: string[];
  forbiddenPaths?: string[];
}
