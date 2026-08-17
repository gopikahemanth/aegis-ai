/**
 * IssueProvider
 *
 * Maps external issue tickets into structured AEGIS product requirements.
 */

export interface ExternalIssue {
  issueId: string;
  title: string;
  description: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  labels: string[];
}

export class IssueProvider {
  /**
   * Convert external issue to natural language prompt for MasterProductPipeline.
   */
  public static mapToPrompt(issue: ExternalIssue): string {
    return `${issue.title}: ${issue.description}`;
  }
}
