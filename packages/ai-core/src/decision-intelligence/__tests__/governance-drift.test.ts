import { describe, it, expect } from "vitest";
import { GovernanceDriftEngine } from "../governance-drift-engine.js";

describe("AEGIS Phase 31 — Governance Drift Engine", () => {
  it("detects critical governance drift on tenant boundary violations and blocks autonomous actions", () => {
    const report = GovernanceDriftEngine.evaluateDrift("org_alpha", "proj_core", 1, 1, 0);
    expect(report.driftClassification).toBe("CRITICAL_DRIFT");
    expect(report.isBlocked).toBe(true);
  });
});
