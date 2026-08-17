import { describe, it, expect } from "vitest";
import { UniversalRequirementInterpreter } from "../universal-requirement-interpreter.js";
import { TemplateStrategyEngine } from "../template-strategy-engine.js";

describe("AEGIS Phase 48 — Template Strategy Engine", () => {
  it("determines strategy based on domain archetype: COMPOSABLE_MODULES vs CUSTOM_GENERATION", () => {
    const ecomSpec = UniversalRequirementInterpreter.interpret("Build an e-commerce platform");
    const ecomStrategy = TemplateStrategyEngine.selectStrategy(ecomSpec);
    expect(ecomStrategy.strategy).toBe("COMPOSABLE_MODULES");

    const customSpec = UniversalRequirementInterpreter.interpret("Build a quantum entanglement simulation dashboard");
    const customStrategy = TemplateStrategyEngine.selectStrategy(customSpec);
    expect(customStrategy.strategy).toBe("CUSTOM_GENERATION");
  });
});
