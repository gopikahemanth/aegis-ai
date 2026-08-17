import { describe, it, expect } from "vitest";
import { ProductDependencyAnalysisEngine } from "../product-dependency-analysis-engine.js";
import { ChangeContractEngine } from "../change-contract-engine.js";
import { ChangeRequestInterpreter } from "../change-request-interpreter.js";
import { ExistingProductUnderstandingEngine } from "../existing-product-understanding-engine.js";
import { ExistingProductScanner } from "../existing-product-scanner.js";

describe("AEGIS Phase 56 — Product Dependency Analysis Engine", () => {
  it("builds dependency graph and identifies critical transaction paths", () => {
    const inventory = ExistingProductScanner.scan();
    const arch = ExistingProductUnderstandingEngine.understand("GymMaster Pro", inventory);
    const interpreted = ChangeRequestInterpreter.interpret("Add online payments");
    const contract = ChangeContractEngine.generateContract(interpreted, arch);

    const graph = ProductDependencyAnalysisEngine.buildGraph(contract);

    expect(graph.nodes.length).toBeGreaterThanOrEqual(4);
    expect(graph.criticalPaths.length).toBeGreaterThan(0);
    const paymentNode = graph.nodes.find((n) => n.name === "Payment");
    expect(paymentNode?.dependencies).toContain("Member");
  });
});
