import { AgentStep } from "../steps/agent-step.js";
import type { WorkflowTransition } from "./workflow-transition.js";

export const workflowDefinition:
  Partial<Record<AgentStep, WorkflowTransition>> = {

  [AgentStep.GENERATE]: {
    onSuccess: AgentStep.REVIEW,
  },

  [AgentStep.REVIEW]: {
    onSuccess: AgentStep.VALIDATE,
  },

 [AgentStep.VALIDATE]: {
    onSuccess: AgentStep.WRITE,
    onFailure: AgentStep.FINISHED,
},

  [AgentStep.WRITE]: {
    onSuccess: AgentStep.INSTALL,
  },

  [AgentStep.INSTALL]: {
    onSuccess: AgentStep.BUILD,
  },

  [AgentStep.BUILD]: {
    onSuccess: AgentStep.FINISHED,
    onFailure: AgentStep.HEAL,
  },

  [AgentStep.HEAL]: {
    onSuccess: AgentStep.BUILD,
  },
};
