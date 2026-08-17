import { describe, it, expect } from "vitest";
import { DesignSystemEngine } from "../design-system-engine.js";

describe("AEGIS Phase 49 — Design System Engine", () => {
  it("generates a machine-readable token system with typography, colors, spacing, radii, and shadows", () => {
    const ds = DesignSystemEngine.generateDesignSystem("Emerald Dark");

    expect(ds.typography.fontFamilySans).toContain("Inter");
    expect(ds.colors.primary[500]).toBe("#10b981");
    expect(ds.colors.background).toBe("#020617");
    expect(ds.radii.md).toBe("0.625rem");
    expect(ds.componentTokens.buttonRadius).toBe("0.625rem");
  });
});
