import { describe, it, expect } from "vitest";
import { InsightValidationEngine } from "../insight-validation-engine.js";

describe("AEGIS Phase 42 — Insight Validation Engine", () => {
  it("validates insights against evidence and never upgrades to verified without experimental confirmation", () => {
    const supported = InsightValidationEngine.validateInsight("ins_1", 3, false, false);
    expect(supported.status).toBe("SUPPORTED");

    const verified = InsightValidationEngine.validateInsight("ins_1", 3, false, true);
    expect(verified.status).toBe("VERIFIED");

    const contradicted = InsightValidationEngine.validateInsight("ins_1", 3, true, false);
    expect(contradicted.status).toBe("CONTRADICTED");
  });
});
