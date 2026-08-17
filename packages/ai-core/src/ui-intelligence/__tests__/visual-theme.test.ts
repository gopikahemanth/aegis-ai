import { describe, it, expect } from "vitest";
import { VisualThemeEngine } from "../visual-theme-engine.js";

describe("AEGIS Phase 49 — Visual Theme Engine", () => {
  it("determines domain theme archetypes and prioritizes explicit user styling overrides", () => {
    const healthTheme = VisualThemeEngine.determineTheme("HEALTHCARE");
    expect(healthTheme.style).toBe("HEALTHCARE");
    expect(healthTheme.accentColor).toBe("#06b6d4");

    const customOverride = VisualThemeEngine.determineTheme("ECOMMERCE", {
      style: "LUXURY",
      accentColor: "#d97706",
    });
    expect(customOverride.style).toBe("LUXURY");
    expect(customOverride.accentColor).toBe("#d97706");
    expect(customOverride.userOverrideApplied).toBe(true);
  });
});
