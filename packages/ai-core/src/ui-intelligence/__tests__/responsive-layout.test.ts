import { describe, it, expect } from "vitest";
import { ResponsiveLayoutEngine } from "../responsive-layout-engine.js";

describe("AEGIS Phase 49 — Responsive Layout Engine", () => {
  it("enforces multi-viewport validation across Desktop, Tablet, and Mobile, detecting horizontal overflow", () => {
    const desktop = ResponsiveLayoutEngine.validateResponsiveViewport("DESKTOP", false);
    expect(desktop.layoutPassed).toBe(true);

    const mobileClean = ResponsiveLayoutEngine.validateResponsiveViewport("MOBILE", false);
    expect(mobileClean.layoutPassed).toBe(true);

    const mobileOverflow = ResponsiveLayoutEngine.validateResponsiveViewport("MOBILE", true);
    expect(mobileOverflow.layoutPassed).toBe(false);
    expect(mobileOverflow.hasHorizontalOverflow).toBe(true);
  });
});
