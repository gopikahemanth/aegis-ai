/**
 * OrganizationalLearningGraph
 *
 * Traceable graph connecting decisions, actions, outcomes, lessons, and future recommendations.
 * Preserves complete institutional lineage across enterprise evolutions.
 */

export interface LearningGraphNode {
  nodeId: string;
  type: "DECISION" | "ACTION" | "OUTCOME" | "LESSON" | "KNOWLEDGE" | "RECOMMENDATION";
  label: string;
  metadata: Record<string, any>;
  timestamp: string;
}

export interface LearningGraphEdge {
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationship: "TRIGGERED" | "RESULTED_IN" | "DERIVED_FROM" | "ENRICHED" | "RECOMMENDED_BY" | "SUPERSEDES";
  confidence: number;
}

export class OrganizationalLearningGraph {
  private static nodes: Map<string, LearningGraphNode> = new Map();
  private static edges: LearningGraphEdge[] = [];

  public static addNode(node: Omit<LearningGraphNode, "timestamp">): LearningGraphNode {
    const fullNode: LearningGraphNode = {
      ...node,
      timestamp: new Date().toISOString(),
    };
    this.nodes.set(node.nodeId, fullNode);
    return fullNode;
  }

  public static addEdge(edge: Omit<LearningGraphEdge, "edgeId">): LearningGraphEdge {
    const fullEdge: LearningGraphEdge = {
      ...edge,
      edgeId: `ledge_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.edges.push(fullEdge);
    return fullEdge;
  }

  public static getNode(nodeId: string): LearningGraphNode | undefined {
    return this.nodes.get(nodeId);
  }

  public static getEdgesBySource(sourceId: string): LearningGraphEdge[] {
    return this.edges.filter((e) => e.sourceNodeId === sourceId);
  }

  public static getAllEdges(): LearningGraphEdge[] {
    return [...this.edges];
  }

  public static reset(): void {
    this.nodes.clear();
    this.edges = [];
  }
}
