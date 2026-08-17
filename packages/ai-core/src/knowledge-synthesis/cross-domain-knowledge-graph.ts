/**
 * CrossDomainKnowledgeGraph
 *
 * Connects knowledge, architecture, reliability, security, and economics into a unified cross-domain graph.
 * Hard Invariant: CORRELATION != CAUSATION.
 */

export type CrossDomainRelationshipType =
  | "CAUSED"
  | "CONTRIBUTED_TO"
  | "CORRELATED_WITH"
  | "DEPENDS_ON"
  | "MITIGATED"
  | "INCREASED"
  | "REDUCED"
  | "BLOCKED"
  | "ENABLED"
  | "RESULTED_IN"
  | "SUPERSEDED"
  | "CONTRADICTS";

export interface CrossDomainEdge {
  edgeId: string;
  sourceId: string;
  sourceDomain: string;
  targetId: string;
  targetDomain: string;
  relationshipType: CrossDomainRelationshipType;
  evidenceIds: string[];
  confidence: number;
  verificationStatus: "UNVERIFIED" | "EMPIRICALLY_VERIFIED";
  timestamp: string;
}

export class CrossDomainKnowledgeGraph {
  private static edges: Map<string, CrossDomainEdge[]> = new Map();

  public static addEdge(edge: Omit<CrossDomainEdge, "edgeId" | "timestamp">): CrossDomainEdge {
    const fullEdge: CrossDomainEdge = {
      ...edge,
      edgeId: `edge_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    const orgEdges = this.edges.get(edge.sourceDomain) || [];
    orgEdges.push(fullEdge);
    this.edges.set(edge.sourceDomain, orgEdges);
    return fullEdge;
  }

  public static getEdgesByDomain(domain: string): CrossDomainEdge[] {
    return this.edges.get(domain) || [];
  }

  public static getAllEdges(): CrossDomainEdge[] {
    const all: CrossDomainEdge[] = [];
    for (const list of this.edges.values()) {
      all.push(...list);
    }
    return all;
  }

  public static reset(): void {
    this.edges.clear();
  }
}
