import { describe, it, expect, beforeEach } from "vitest";
import { InnovationAuthorizationEngine } from "../innovation-authorization.js";

describe("AEGIS Phase 36 — Innovation Authorization Engine", () => {
  beforeEach(() => {
    InnovationAuthorizationEngine.reset();
  });

  it("governs role-based authorization with cryptographic signature capture", () => {
    const req = InnovationAuthorizationEngine.requestAuthorization(
      "opp_1",
      "prod_lead_1",
      "tenant_gym",
      "org_global",
      "PRODUCT_LEAD"
    );
    expect(req.status).toBe("PENDING");

    const approved = InnovationAuthorizationEngine.grantAuthorization(
      "opp_1",
      "prod_lead_1",
      "sig_prod_lead_p36_valid",
      "Approved after value verification & simulation review"
    );
    expect(approved.status).toBe("APPROVED");
    expect(approved.authorizationSignature).toBe("sig_prod_lead_p36_valid");
  });
});
