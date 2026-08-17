import { describe, it, expect } from "vitest";
import { ProductImpactAnalysisEngine } from "../product-impact-analysis-engine.js";
import { ChangeContractEngine } from "../change-contract-engine.js";
import { ChangeRequestInterpreter } from "../change-request-interpreter.js";
import { ExistingProductUnderstandingEngine } from "../existing-product-understanding-engine.js";
import { ExistingProductScanner } from "../existing-product-scanner.js";

describe("AEGIS Phase 56 — Product Impact Analysis Engine", () => {
  it("evaluates impact severity across database, business logic, security, and UI", () => {
    const inventory = ExistingProductScanner.scan();
    const arch = ExistingProductUnderstandingEngine.understand("GymMaster Pro", inventory);
    const interpreted = ChangeRequestInterpreter.interpret("Add online payments");
    const contract = ChangeContractEngine.generateContract(interpreted, arch);

    const report = ProductImpactAnalysisEngine.analyze(contract);

    expect(report.overallSeverity).toBe("HIGH");
    expect(report.requiresDataMigration).toBe(true);
    expect(report.requiresAuthChanges).toBe(true);
    expect(report.impactedAreas.length).toBeGreaterThanOrEqual(4);
  });
});
