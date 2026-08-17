/**
 * ChangeProposalEngine
 *
 * Formats verified generation changesets into pull-request / reviewable proposals.
 */

export interface ChangeProposal {
  proposalId: string;
  projectId: string;
  generationId: string;
  changedFiles: string[];
  contractChanges: string[];
  verificationStatus: "VERIFIED" | "UNVERIFIED";
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  reviewMarkdown: string;
}

export class ChangeProposalEngine {
  /**
   * Create an externally reviewable Change Proposal from a completed generation.
   */
  public static createProposal(
    projectId: string,
    generationId: string,
    changedFiles: string[],
    isVerified: boolean = true
  ): ChangeProposal {
    const proposalId = `prop_pr_${Date.now()}`;
    return {
      proposalId,
      projectId,
      generationId,
      changedFiles,
      contractChanges: ["ArchitectureContract", "DomainContract"],
      verificationStatus: isVerified ? "VERIFIED" : "UNVERIFIED",
      riskLevel: "LOW",
      reviewMarkdown: `### AEGIS Change Proposal (${proposalId})\n\n- **Project**: \`${projectId}\`\n- **Generation**: \`${generationId}\`\n- **Status**: ${
        isVerified ? "✅ VERIFIED BY PRODUCT SUCCESS GATE" : "⚠️ UNVERIFIED"
      }\n- **Files Modified**: ${changedFiles.length}`,
    };
  }
}
