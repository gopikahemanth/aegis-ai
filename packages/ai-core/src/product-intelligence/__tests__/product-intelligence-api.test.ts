import { describe, it, expect } from "vitest";
import { AegisProductBuilder } from "../product-intelligence-api.js";

describe("AEGIS Phase 50 — AegisProductBuilder Unified API", () => {
  it("builds a complete verified product from a single prompt and options call", async () => {
    const result = await AegisProductBuilder.buildProduct({
      requirement: "Build a complete modern SaaS analytics dashboard with charts and team management",
      preferredName: "AegisAnalytics",
    });

    expect(result.plan.productName).toBe("AegisAnalytics");
    expect(result.acceptance.isAccepted).toBe(true);
    expect(result.deliveryManifest.status).toBe("DELIVERED");
    expect(result.certificate.tier).toBe(37);
  });
});
