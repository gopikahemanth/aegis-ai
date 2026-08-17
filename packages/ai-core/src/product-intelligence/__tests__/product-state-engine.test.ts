import { describe, it, expect } from "vitest";
import { ProductStateEngine } from "../product-state-engine.js";

describe("AEGIS Phase 50 — Product State Engine", () => {
  it("tracks authoritative state and rejects completion if any dimension is unverified", () => {
    const state = ProductStateEngine.initializeState("AegisPlatform", "SAAS", 20);

    expect(ProductStateEngine.isProductComplete(state)).toBe(true);

    const incompleteState = { ...state, api: "FAIL" as const };
    expect(ProductStateEngine.isProductComplete(incompleteState)).toBe(false);
  });
});
