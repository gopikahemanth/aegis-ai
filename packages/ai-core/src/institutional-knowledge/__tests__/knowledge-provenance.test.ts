import { describe, it, expect } from "vitest";
import { KnowledgeProvenanceEngine } from "../knowledge-provenance-engine.js";

describe("AEGIS Phase 41 — Knowledge Provenance Engine", () => {
  it("enforces traceable evidence provenance for institutional knowledge items", () => {
    const prov = KnowledgeProvenanceEngine.buildProvenance(
      "k_item_pool_1",
      "EXPERIENCE",
      "exp_123",
      ["ev_1", "ev_2"],
      "vp_eng_lead"
    );

    expect(prov.verificationStatus).toBe("EMPIRICALLY_VALIDATED");
    expect(prov.provenanceScore).toBeGreaterThanOrEqual(0.95);
    expect(prov.humanValidationActor).toBe("vp_eng_lead");
  });
});
