import { describe, it, expect, beforeEach } from "vitest";
import { EvolutionAuthorizationEngine } from "../evolution-authorization.js";

describe("AEGIS Phase 35 — Evolution Authorization Engine", () => {
  beforeEach(() => {
    EvolutionAuthorizationEngine.reset();
  });

  it("governs role-based authorization for system evolution programs", () => {
    const req = EvolutionAuthorizationEngine.requestAuthorization("opp_1", "arch_lead_1", "ENTERPRISE_ARCHITECT");
    expect(req.status).toBe("PENDING");

    const approved = EvolutionAuthorizationEngine.grantAuthorization(
      "opp_1",
      "arch_lead_1",
      "sig_arch_lead_valid_123",
      "Approved after architecture review"
    );
    expect(approved.status).toBe("APPROVED");
    expect(approved.authorizationSignature).toBe("sig_arch_lead_valid_123");
  });
});
