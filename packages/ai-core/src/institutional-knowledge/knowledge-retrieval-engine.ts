/**
 * KnowledgeRetrievalEngine
 *
 * Provides context-aware retrieval of relevant institutional experiences, patterns, and historical resolutions.
 * Hard Invariants: Retrieval performs STRICTLY ZERO mutations (source, database, deployment).
 * Clearly distinguishes HISTORICAL_FACT, RECOMMENDATION, FORECAST, and INFERENCE.
 */

export interface KnowledgeRetrievalQuery {
  organizationId: string;
  projectId: string;
  environment: string;
  symptoms: string[];
  technologyStack: string[];
}

export interface RetrievedKnowledgeItem {
  knowledgeId: string;
  itemType: "HISTORICAL_FACT" | "RECOMMENDATION" | "FORECAST" | "INFERENCE";
  title: string;
  content: string;
  confidence: number;
  relevanceScore: number;
  sourceEvidenceIds: string[];
}

export interface KnowledgeRetrievalResult {
  queryId: string;
  organizationId: string;
  projectId: string;
  items: RetrievedKnowledgeItem[];
  sourceMutationsAttempted: number; // Strictly 0
  databaseMutationsAttempted: number; // Strictly 0
  deploymentMutationsAttempted: number; // Strictly 0
  summary: string;
}

export class KnowledgeRetrievalEngine {
  private static knowledgeStore: Map<string, RetrievedKnowledgeItem[]> = new Map();

  public static indexKnowledge(organizationId: string, item: RetrievedKnowledgeItem): void {
    const existing = this.knowledgeStore.get(organizationId) || [];
    existing.push(item);
    this.knowledgeStore.set(organizationId, existing);
  }

  public static retrieve(query: KnowledgeRetrievalQuery): KnowledgeRetrievalResult {
    const orgItems = this.knowledgeStore.get(query.organizationId) || [];

    // Filter relevant items based on symptom keywords
    const matched = orgItems.filter((it) =>
      query.symptoms.some((s) => it.content.toLowerCase().includes(s.toLowerCase()) || it.title.toLowerCase().includes(s.toLowerCase()))
    );

    return {
      queryId: `query_${Date.now()}`,
      organizationId: query.organizationId,
      projectId: query.projectId,
      items: matched.length > 0 ? matched : orgItems,
      sourceMutationsAttempted: 0,
      databaseMutationsAttempted: 0,
      deploymentMutationsAttempted: 0,
      summary: `Retrieved ${matched.length > 0 ? matched.length : orgItems.length} institutional knowledge item(s) for organization ${query.organizationId} (0 mutations).`,
    };
  }

  public static reset(): void {
    this.knowledgeStore.clear();
  }
}
