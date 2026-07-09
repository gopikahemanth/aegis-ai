import { AgentStep } from "../steps/agent-step.js";
import type { AgentState } from "./agent-state.js";

export class StateFactory {
  create(
    request: string,
    projectPath: string,
  ): AgentState {

   return {
  request,
  projectPath,

  currentStep:
    AgentStep.GENERATE,

  reviewPassed: false,

  buildPassed: false,

  buildStdout: "",

  buildStderr: "",

  lastBuildError: "",

  testPassed: false,

  deployCompleted: false,

  healAttempts: 0,

  completed: false,
};
  }
}
