import { describe, it, expect } from "vitest";
import { EvolutionProposalEngine } from "../evolution-proposal-engine.js";

describe("AEGIS Phase 39 — Evolution Proposal Engine", () => {
  it("compiles change opportunities into formal evolution proposals", () => {
    const proposal = EvolutionProposalEngine.createProposal(
      "opp_123",
      "ARCHITECTURE_CHANGE",
      "Event Bus Migration for Cross-Project Telemetry",
      ["proj_gym", "proj_member"],
      120000,
      20000,
      "Resolved 2 operational incidents"
    );

    expect(proposal.proposalId).toBeDefined();
    expect(proposal.type).toBe("ARCHITECTURE_CHANGE");
    expect(proposal.affectedProjects.length).toBe(2);
    expect(proposal.rollbackPlan.length).toBeGreaterThan(0);
    expect(proposal.requiredAuthorization).toBe("PLATFORM_ADMIN");
  });
});
