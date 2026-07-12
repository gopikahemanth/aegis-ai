import { ExecutionPhase } from "./execution-phase.js";

export interface ExecutionState {
  phase: ExecutionPhase;

  startedAt: Date;

  completed: boolean;
}
