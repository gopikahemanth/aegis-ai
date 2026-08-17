/**
 * EnterpriseDecisionKnowledgeGraph
 *
 * Models a read-oriented graph connecting strategic initiatives, engineering decisions,
 * releases, incidents, recoveries, costs, business outcomes, and certifications.
 */

export interface DecisionGraphNode {
  nodeId: string;
  nodeType: "INITIATIVE" | "DECISION" | "RELEASE" | "INCIDENT" | "RECOVERY" | "OUTCOME" | "CERTIFICATE";
  label: string;
  projectId: string;
  timestamp: string;
  isVerified: boolean;
}

export interface DecisionGraphEdge {
  fromNodeId: string;
  toNodeId: string;
  relationship: "TRIGGERED_BY" | "EXECUTED_IN" | "RESOLVED_BY" | "PRODUCED_OUTCOME" | "CERTIFIED_BY";
  provenance: string;
}

export class EnterpriseDecisionKnowledgeGraph {
  private static nodes: Map<string, DecisionGraphNode> = new Map();
  private static edges: DecisionGraphEdge[] = [];

  public static addNode(node: DecisionGraphNode): void {
    this.nodes.set(node.nodeId, node);
  }

  public static addEdge(edge: DecisionGraphEdge): void {
    this.edges.push(edge);
  }

  public static getNodes(): DecisionGraphNode[] {
    return Array.from(this.nodes.values());
  }

  public static getEdges(): DecisionGraphEdge[] {
    return [...this.edges];
  }

  public static getLineage(nodeId: string): { nodes: DecisionGraphNode[]; edges: DecisionGraphEdge[] } {
    const relevantEdges = this.edges.filter((e) => e.fromNodeId === nodeId || e.toNodeId === nodeId);
    const nodeIds = new Set<string>([nodeId]);
    for (const e of relevantEdges) {
      nodeIds.add(e.fromNodeId);
      nodeIds.add(e.toNodeId);
    }
    const relevantNodes = Array.from(this.nodes.values()).filter((n) => nodeIds.has(n.nodeId));
    return { nodes: relevantNodes, edges: relevantEdges };
  }

  public static reset(): void {
    this.nodes.clear();
    this.edges = [];
  }
}
