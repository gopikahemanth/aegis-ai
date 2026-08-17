/**
 * EnterpriseWorkflowEngine
 *
 * Coordinates long-running multi-stage enterprise engineering workflows across
 * Organizations, Teams, Projects, and Environments.
 */

export type WorkflowState =
  | "CREATED"
  | "PLANNED"
  | "WAITING_FOR_INPUT"
  | "WAITING_FOR_APPROVAL"
  | "READY"
  | "EXECUTING"
  | "VERIFYING"
  | "WAITING_FOR_REVIEW"
  | "COMPLETED"
  | "BLOCKED"
  | "FAILED"
  | "CANCELLED";

export interface EnterpriseWorkflow {
  workflowId: string;
  organizationId: string;
  projectId: string;
  environment: string;
  title: string;
  state: WorkflowState;
  createdAt: string;
  updatedAt: string;
  steps: Array<{
    stepId: string;
    title: string;
    type: "HUMAN_APPROVAL" | "AUTONOMOUS_EXECUTION" | "VERIFICATION";
    completed: boolean;
  }>;
}

export class EnterpriseWorkflowEngine {
  private static workflows: Map<string, EnterpriseWorkflow> = new Map();

  public static createWorkflow(params: {
    workflowId: string;
    organizationId: string;
    projectId: string;
    environment: string;
    title: string;
    steps?: EnterpriseWorkflow["steps"];
  }): EnterpriseWorkflow {
    const workflow: EnterpriseWorkflow = {
      ...params,
      state: "CREATED",
      steps: params.steps || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.workflows.set(params.workflowId, workflow);
    return workflow;
  }

  public static transitionState(workflowId: string, newState: WorkflowState): boolean {
    const wf = this.workflows.get(workflowId);
    if (!wf) return false;
    wf.state = newState;
    wf.updatedAt = new Date().toISOString();
    return true;
  }

  public static getWorkflow(workflowId: string): EnterpriseWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  public static reset(): void {
    this.workflows.clear();
  }
}
