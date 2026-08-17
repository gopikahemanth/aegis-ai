import { describe, it, expect } from "vitest";
import { DesignSystemEngine } from "../design-system-engine.js";
import { UIConsistencyEngine } from "../ui-consistency-engine.js";

describe("AEGIS Phase 49 — UI Consistency Engine", () => {
  it("detects token drift and mismatched border radii against the design system", () => {
    const ds = DesignSystemEngine.generateDesignSystem();

    const cleanReport = UIConsistencyEngine.auditConsistency(ds);
    expect(cleanReport.isConsistent).toBe(true);
    expect(cleanReport.defects.length).toBe(0);

    const driftReport = UIConsistencyEngine.auditConsistency(ds, {
      component: "PrimaryButton",
      problem: "3 instances use radius 4px instead of token 10px (0.625rem)",
    });
    expect(driftReport.isConsistent).toBe(false);
    expect(driftReport.defects.length).toBe(1);
    expect(driftReport.defects[0].component).toBe("PrimaryButton");
  });
});
