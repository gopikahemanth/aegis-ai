import { describe, it, expect } from "vitest";
import { RecoveryOutcomeEngine } from "../recovery-outcome-engine.js";

describe("AEGIS Phase 30 — Recovery Outcome Engine", () => {
  it("enforces distinction: SERVICE_RECOVERED != BUSINESS_CAPABILITY_RECOVERED", () => {
    const techOnly = RecoveryOutcomeEngine.verifyOutcome("proj_core", true, true, true, false);
    expect(techOnly.finalOutcome).toBe("TECHNICALLY_RECOVERED");

    const full = RecoveryOutcomeEngine.verifyOutcome("proj_core", true, true, true, true);
    expect(full.finalOutcome).toBe("BUSINESS_RECOVERED");
  });
});
