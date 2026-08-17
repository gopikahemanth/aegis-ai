import { describe, it, expect, beforeEach } from "vitest";
import { ProductAuthorizationEngine } from "../product-authorization-engine.js";

describe("AEGIS Phase 37 — Product Authorization Engine", () => {
  beforeEach(() => {
    ProductAuthorizationEngine.reset();
  });

  it("governs role-based authorization with cryptographic signature capture", () => {
    const req = ProductAuthorizationEngine.requestAuthorization(
      "opp_1",
      "vp_prod_1",
      "tenant_gym",
      "org_global",
      "VP_PRODUCT"
    );
    expect(req.status).toBe("PENDING");

    const approved = ProductAuthorizationEngine.grantAuthorization(
      "opp_1",
      "vp_prod_1",
      "sig_vp_product_p37_valid",
      "Approved after customer retention & zero-mutation review"
    );
    expect(approved.status).toBe("APPROVED");
    expect(approved.signature).toBe("sig_vp_product_p37_valid");
  });
});
