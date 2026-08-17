import { describe, it, expect } from "vitest";
import { ProductCompletenessEngine } from "../product-completeness-engine.js";
import { DeepProductBuilderGate } from "../deep-product-builder-gate.js";

describe("AEGIS Phase 51 — Deep Product Builder Gate", () => {
  it("issues Tier 38 apex completeness certificate and records ledger entry", () => {
    const scorecard = ProductCompletenessEngine.evaluateCompleteness(0, 100);
    const cert = DeepProductBuilderGate.evaluateAndCertify("AegisPlatform", scorecard, 24, 18);

    expect(cert.gate).toBe("DeepProductCompletenessGate");
    expect(cert.tier).toBe(38);
    expect(cert.status).toBe("ACCEPTED");
    expect(cert.requirements.complete).toBe(24);
    expect(cert.criticalDefects).toBe(0);
  });
});
