/**
 * UniversalWorkflowEngine
 *
 * Formulates and compiles domain-agnostic executable business workflows.
 * Invariant: FEATURE != VERIFIED WORKFLOW (Multi-step business workflows must be proven end-to-end).
 */

import { type UniversalProductSpecification, type BusinessWorkflow } from "./universal-requirement-interpreter.js";

export interface CompiledExecutableWorkflow {
  workflowId: string;
  name: string;
  actor: string;
  totalSteps: number;
  steps: {
    order: number;
    description: string;
    targetEndpoint?: string;
    domAction?: string;
    expectedOutcome: string;
  }[];
}

export class UniversalWorkflowEngine {
  public static compileWorkflows(spec: UniversalProductSpecification): CompiledExecutableWorkflow[] {
    return spec.workflows.map((wf) => ({
      workflowId: wf.id,
      name: wf.name,
      actor: wf.actor,
      totalSteps: wf.steps.length,
      steps: wf.steps.map((s) => ({
        order: s.stepIndex,
        description: s.action,
        targetEndpoint: s.endpoint,
        domAction: `Trigger [${s.action}] as actor [${s.actor}]`,
        expectedOutcome: s.expectedResult,
      })),
    }));
  }
}
