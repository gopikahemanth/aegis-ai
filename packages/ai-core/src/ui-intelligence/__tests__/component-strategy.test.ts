import { describe, it, expect } from "vitest";
import { ComponentStrategyEngine } from "../component-strategy-engine.js";

describe("AEGIS Phase 49 — Component Strategy Engine", () => {
  it("maintains a canonical catalog of modular UI primitives to prevent duplicated ad-hoc components", () => {
    const catalog = ComponentStrategyEngine.getCanonicalCatalog();

    expect(catalog.length).toBeGreaterThanOrEqual(10);
    expect(catalog.some((c) => c.name === "Button")).toBe(true);
    expect(catalog.some((c) => c.name === "DataTable")).toBe(true);
    expect(catalog.some((c) => c.name === "Modal")).toBe(true);
    expect(catalog.some((c) => c.name === "LoadingState")).toBe(true);
  });
});
