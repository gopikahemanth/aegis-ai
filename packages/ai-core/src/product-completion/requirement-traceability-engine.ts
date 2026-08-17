/**
 * RequirementTraceabilityEngine
 *
 * Maintains end-to-end traceability links from original user requirements to code files,
 * database models, API endpoints, tests, and live browser workflow evidence.
 */

export interface RequirementTraceabilityNode {
  requirementId: string;
  userPromptSnippet: string;
  architectureContractHash: string;
  sourceFiles: string[];
  apiEndpoints: string[];
  dbModels: string[];
  unitTests: string[];
  browserWorkflowIds: string[];
  evidenceIds: string[];
}

export class RequirementTraceabilityEngine {
  private static graph: Map<string, RequirementTraceabilityNode> = new Map();

  public static registerTrace(trace: RequirementTraceabilityNode): RequirementTraceabilityNode {
    this.graph.set(trace.requirementId, trace);
    return trace;
  }

  public static getTrace(requirementId: string): RequirementTraceabilityNode | undefined {
    return this.graph.get(requirementId);
  }

  public static getAllTraces(): RequirementTraceabilityNode[] {
    return Array.from(this.graph.values());
  }

  public static verifyFullTraceability(): boolean {
    if (this.graph.size === 0) return false;
    for (const node of this.graph.values()) {
      if (
        node.sourceFiles.length === 0 ||
        node.apiEndpoints.length === 0 ||
        node.dbModels.length === 0 ||
        node.evidenceIds.length === 0
      ) {
        return false;
      }
    }
    return true;
  }

  public static reset(): void {
    this.graph.clear();
  }
}
