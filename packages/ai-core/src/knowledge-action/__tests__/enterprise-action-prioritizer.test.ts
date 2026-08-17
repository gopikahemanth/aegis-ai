import { describe, it, expect } from "vitest";
import { EnterpriseActionPrioritizer } from "../enterprise-action-prioritizer.js";

describe("AEGIS Phase 43 — Enterprise Action Prioritizer", () => {
  it("deterministically ranks knowledge-derived actions", () => {
    const ranked = EnterpriseActionPrioritizer.rankActions([
      { actionId: "a1", title: "Minor log tweak", business: 20, reliability: 30, security: 10, risk: 5 },
      { actionId: "a2", title: "Standardize Database Pool", business: 85, reliability: 95, security: 80, risk: 10 },
      { actionId: "a3", title: "Patch CVE Critical", business: 90, reliability: 80, security: 95, risk: 15 },
    ]);

    expect(ranked[0].actionId).toBe("a3");
    expect(ranked[0].priority).toBe("CRITICAL");
    expect(ranked[ranked.length - 1].actionId).toBe("a1");

  });
});
