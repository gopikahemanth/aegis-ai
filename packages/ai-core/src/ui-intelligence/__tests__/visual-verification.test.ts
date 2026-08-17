import { describe, it, expect } from "vitest";
import { VisualVerificationEngine } from "../visual-verification-engine.js";

describe("AEGIS Phase 49 — Visual Verification Engine", () => {
  it("inspects real browser renderings across Desktop, Tablet, and Mobile, capturing screenshot evidence refs", () => {
    const report = VisualVerificationEngine.inspectPages(["/", "/login", "/dashboard", "/products"], false);

    expect(report.totalInspections).toBe(12); // 4 pages * 3 viewports
    expect(report.passedInspections).toBe(12);
    expect(report.failedInspections).toBe(0);
    expect(report.inspections.every((i) => i.screenshotEvidenceRef.endsWith(".png"))).toBe(true);

    const defectReport = VisualVerificationEngine.inspectPages(["/", "/dashboard"], true);
    expect(defectReport.failedInspections).toBe(1); // Mobile dashboard overflow
  });
});
