/**
 * UserWorkflowGraph
 *
 * Models end-to-end user journeys as executable workflow graphs that integrate
 * with GoldenWorkflowRegistry for runtime regression verification.
 */

export interface WorkflowNode {
  id: string;
  name: string;
  feature: string;
  steps: Array<{ action: string; target: string; expectedOutcome: string }>;
  apiEndpoint?: string;
  browserRoute?: string;
}

export class UserWorkflowGraph {
  private nodes: Map<string, WorkflowNode> = new Map();

  public addWorkflow(node: WorkflowNode): void {
    this.nodes.set(node.id, node);
  }

  public getWorkflow(id: string): WorkflowNode | undefined {
    return this.nodes.get(id);
  }

  public getAllWorkflows(): WorkflowNode[] {
    return Array.from(this.nodes.values());
  }
}
