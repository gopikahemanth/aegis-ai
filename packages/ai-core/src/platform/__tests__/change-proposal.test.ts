import { describe, it, expect } from "vitest";
import { ChangeProposalEngine } from "../../integrations/code-review/change-proposal-engine.js";

describe("AEGIS Phase 18 — Change Proposal Engine", () => {
  it("formats verified changesets into reviewable pull request proposals", () => {
    const proposal = ChangeProposalEngine.createProposal(
      "gym_proj",
      "gen_101",
      ["src/features/members/MemberList.tsx", "server/routes/members.ts"],
      true
    );

    expect(proposal.verificationStatus).toBe("VERIFIED");
    expect(proposal.changedFiles.length).toBe(2);
    expect(proposal.reviewMarkdown).toContain("VERIFIED BY PRODUCT SUCCESS GATE");
  });
});
