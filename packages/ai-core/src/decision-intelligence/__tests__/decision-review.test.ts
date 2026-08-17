import { describe, it, expect, beforeEach } from "vitest";
import { DecisionReviewEngine } from "../decision-review-engine.js";

describe("AEGIS Phase 31 — Decision Review Engine", () => {
  beforeEach(() => {
    DecisionReviewEngine.reset();
  });

  it("coordinates multi-stage proposal, review, and approval workflow", () => {
    const proposed = DecisionReviewEngine.proposeDecision("dec_cache_scale", "proj_core", "Scale Redis Caching Cluster", "lead_dev_1");
    expect(proposed.stage).toBe("PROPOSED");

    const approved = DecisionReviewEngine.approveDecision("dec_cache_scale", "lead_arch_1", "sig_auth_9988");
    expect(approved.stage).toBe("APPROVED");
    expect(approved.authorizationHash).toBe("sig_auth_9988");
  });
});
