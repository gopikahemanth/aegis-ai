import { describe, it, expect } from "vitest";
import { ProductCompletenessAnalyzer } from "../product-completeness-analyzer.js";

describe("AEGIS Phase 45 — Product Completeness Analyzer", () => {
  it("detects missing, partial, unwired, and verified features accurately", () => {
    const missing = ProductCompletenessAnalyzer.analyzeRequirement("REQ-001", false, false, false, false, false);
    expect(missing.state).toBe("MISSING_FEATURE");
    expect(missing.completenessScore).toBe(0);

    const unwired = ProductCompletenessAnalyzer.analyzeRequirement("REQ-002", true, true, true, false, false, true);
    expect(unwired.state).toBe("UNWIRED_FEATURE");

    const partial = ProductCompletenessAnalyzer.analyzeRequirement("REQ-003", true, false, false, false, false);
    expect(partial.state).toBe("PARTIAL_FEATURE");

    const verified = ProductCompletenessAnalyzer.analyzeRequirement("REQ-004", true, true, true, true, true);
    expect(verified.state).toBe("VERIFIED_FEATURE");
    expect(verified.completenessScore).toBe(100);
  });
});
