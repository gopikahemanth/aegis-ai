import { describe, it, expect } from "vitest";
import { BackendEvolutionEngine } from "../backend-evolution-engine.js";

describe("AEGIS Phase 56 — Backend Evolution Engine", () => {
  it("adds new payment endpoints while preserving existing endpoints", () => {
    const report = BackendEvolutionEngine.evolveBackend();
    expect(report.isBackendHealthy).toBe(true);
    expect(report.newEndpointsAdded).toBe(3);
    expect(report.existingEndpointsPreserved).toBe(5);
  });

  it("detects regressions when an existing endpoint breaks during modification", () => {
    const report = BackendEvolutionEngine.evolveBackend({ simulateRegressionOnExistingEndpoint: true });
    expect(report.isBackendHealthy).toBe(false);
    expect(report.summary).toContain("regression detected");
  });
});
