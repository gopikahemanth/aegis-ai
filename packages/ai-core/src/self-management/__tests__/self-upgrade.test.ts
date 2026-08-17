import { describe, it, expect } from "vitest";
import { SelfUpgradeEngine } from "../self-upgrade-engine.js";

describe("AEGIS Phase 20 — Self-Upgrade Engine & Simulation", () => {
  it("proposes minor safe upgrade without blocking authorization", () => {
    const proposal = SelfUpgradeEngine.proposeUpgrade("vitest", "^4.1.0", "^4.1.10", false);
    expect(proposal.simulationPassed).toBe(true);
    expect(proposal.requiresAuthorization).toBe(false);
    expect(proposal.status).toBe("PROPOSED");
  });

  it("requires authorization and simulation validation for major breaking upgrade", () => {
    const proposal = SelfUpgradeEngine.proposeUpgrade("vitest", "^4.1.10", "^5.0.0", true);
    expect(proposal.requiresAuthorization).toBe(true);
    expect(proposal.status).toBe("AWAITING_AUTHORIZATION");
  });
});
