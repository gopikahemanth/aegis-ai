import { describe, it, expect } from "vitest";
import { ProductionObservabilityEngine } from "../production-observability-engine.js";

describe("AEGIS Phase 53 — Production Observability Engine", () => {
  it("confirms baseline observability when critical items are present", () => {
    const r = ProductionObservabilityEngine.verify([
      "structured_logging", "health_checks", "startup_diagnostics", "deployment_version",
    ]);
    expect(r.isBaselinePresent).toBe(true);
    expect(r.checks.filter((c) => c.state === "PRESENT").length).toBeGreaterThan(0);
  });

  it("classifies missing optional integrations as CONFIGURATION_REQUIRED, not silent failure", () => {
    const r = ProductionObservabilityEngine.verify(["structured_logging", "health_checks", "startup_diagnostics"]);
    expect(r.configurationRequiredItems.length).toBeGreaterThan(0);
  });

  it("reports incomplete when critical observability items are missing", () => {
    const r = ProductionObservabilityEngine.verify([]);
    expect(r.isBaselinePresent).toBe(false);
    expect(r.notConfiguredItems.length).toBeGreaterThan(0);
  });
});
