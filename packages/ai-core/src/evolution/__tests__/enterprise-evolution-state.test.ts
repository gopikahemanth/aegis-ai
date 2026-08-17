import { describe, it, expect, beforeEach } from "vitest";
import { EnterpriseEvolutionStateEngine } from "../enterprise-evolution-state.js";

describe("AEGIS Phase 39 — Enterprise Evolution State Engine", () => {
  beforeEach(() => {
    EnterpriseEvolutionStateEngine.reset();
  });

  it("initializes evolution records and transitions lifecycle stages", () => {
    const record = EnterpriseEvolutionStateEngine.initializeEvolution(
      "evol_1",
      "proj_gym",
      "tenant_gym",
      1,
      1
    );

    expect(record.evolutionId).toBe("evol_1");
    expect(record.stage).toBe("OBSERVED");
    expect(record.governanceState).toBe("HEALTHY");

    const proposed = EnterpriseEvolutionStateEngine.transitionStage("evol_1", "PROPOSED");
    expect(proposed.stage).toBe("PROPOSED");

    const executing = EnterpriseEvolutionStateEngine.transitionStage("evol_1", "EXECUTING");
    expect(executing.stage).toBe("EXECUTING");

    const verified = EnterpriseEvolutionStateEngine.transitionStage("evol_1", "VERIFIED");
    expect(verified.stage).toBe("VERIFIED");
  });

  it("supports failure and rollback transition paths", () => {
    EnterpriseEvolutionStateEngine.initializeEvolution("evol_failed", "proj_gym", "tenant_gym");
    EnterpriseEvolutionStateEngine.transitionStage("evol_failed", "EXECUTING");

    const failed = EnterpriseEvolutionStateEngine.transitionStage("evol_failed", "FAILED", "ELEVATED_RISK");
    expect(failed.stage).toBe("FAILED");
    expect(failed.governanceState).toBe("ELEVATED_RISK");

    const rolledBack = EnterpriseEvolutionStateEngine.transitionStage("evol_failed", "ROLLBACK");
    expect(rolledBack.stage).toBe("ROLLBACK");

    const restored = EnterpriseEvolutionStateEngine.transitionStage("evol_failed", "RESTORED", "HEALTHY");
    expect(restored.stage).toBe("RESTORED");
    expect(restored.governanceState).toBe("HEALTHY");
  });
});
