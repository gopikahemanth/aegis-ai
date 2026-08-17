import { describe, it, expect } from "vitest";
import { ProductModificationPlanner } from "../product-modification-planner.js";
import { ProductDependencyAnalysisEngine } from "../product-dependency-analysis-engine.js";
import { ChangeContractEngine } from "../change-contract-engine.js";
import { ChangeRequestInterpreter } from "../change-request-interpreter.js";
import { ExistingProductUnderstandingEngine } from "../existing-product-understanding-engine.js";
import { ExistingProductScanner } from "../existing-product-scanner.js";

describe("AEGIS Phase 56 — Product Modification Planner", () => {
  it("creates an ordered 10-step modification plan across all layers", () => {
    const inventory = ExistingProductScanner.scan();
    const arch = ExistingProductUnderstandingEngine.understand("GymMaster Pro", inventory);
    const interpreted = ChangeRequestInterpreter.interpret("Add online payments");
    const contract = ChangeContractEngine.generateContract(interpreted, arch);
    const graph = ProductDependencyAnalysisEngine.buildGraph(contract);

    const plan = ProductModificationPlanner.plan(contract, graph);

    expect(plan.steps).toHaveLength(10);
    expect(plan.steps[0].layer).toBe("DATABASE");
    expect(plan.steps[1].layer).toBe("DATABASE");
    expect(plan.steps[9].layer).toBe("VERIFICATION");
    expect(plan.totalSteps).toBe(10);
  });
});
