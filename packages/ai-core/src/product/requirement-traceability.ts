/**
 * RequirementTraceability
 *
 * Maintains end-to-end traceability from Natural Language User Requirements
 * through Product Specifications, Features, Workflows, Contracts, Tasks, Files,
 * Implementation and Verification Evidence.
 */

export interface TraceabilityNode {
  requirementId: string;
  userPrompt: string;
  source: "EXPLICIT" | "INFERRED" | "OPTIONAL";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  featureId: string;
  workflowId?: string;
  contractHashes: Record<string, string>;
  taskIds: string[];
  ownedFiles: string[];
  verificationEvidence: string[];
  status: "REQUESTED" | "PLANNED" | "IMPLEMENTING" | "IMPLEMENTED" | "VERIFIED" | "FAILED" | "INCOMPLETE";
}

export class RequirementTraceabilityMatrix {
  private nodes: Map<string, TraceabilityNode> = new Map();

  public registerRequirement(node: TraceabilityNode): void {
    this.nodes.set(node.requirementId, node);
  }

  public getNode(requirementId: string): TraceabilityNode | undefined {
    return this.nodes.get(requirementId);
  }

  public getAllNodes(): TraceabilityNode[] {
    return Array.from(this.nodes.values());
  }

  public updateStatus(
    requirementId: string,
    status: TraceabilityNode["status"],
    evidence?: string
  ): void {
    const node = this.nodes.get(requirementId);
    if (node) {
      node.status = status;
      if (evidence) node.verificationEvidence.push(evidence);
    }
  }

  public verifyCompleteness(): { isComplete: boolean; unverified: string[]; completedCount: number } {
    const unverified: string[] = [];
    let completedCount = 0;

    for (const node of this.nodes.values()) {
      if (node.status === "VERIFIED") {
        completedCount++;
      } else {
        unverified.push(`${node.requirementId} (${node.featureId}): status is ${node.status}`);
      }
    }

    return {
      isComplete: unverified.length === 0,
      unverified,
      completedCount,
    };
  }
}
