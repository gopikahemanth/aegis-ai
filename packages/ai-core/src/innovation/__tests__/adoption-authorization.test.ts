import { describe, it, expect, beforeEach } from "vitest";
import { AdoptionAuthorizationEngine } from "../adoption-authorization-engine.js";

describe("AEGIS Phase 40 — Adoption Authorization Engine", () => {
  beforeEach(() => {
    AdoptionAuthorizationEngine.reset();
  });

  it("governs the request and granting of VP Engineering adoption authorization", () => {
    const req = AdoptionAuthorizationEngine.requestAdoption("exp_123", "VP_ENGINEERING", 240000);
    expect(req.decision).toBe("REQUEST_AUTHORIZATION");

    const grant = AdoptionAuthorizationEngine.grantAdoption("exp_123", "vp_eng_1", "sig_vp_eng_valid");
    expect(grant.decision).toBe("APPROVE_ADOPTION");
    expect(grant.signature).toBe("sig_vp_eng_valid");
  });
});
