import { describe, it, expect } from "vitest";
import { ChangeContractEngine } from "../change-contract-engine.js";
import { ChangeRequestInterpreter } from "../change-request-interpreter.js";
import { ExistingProductUnderstandingEngine } from "../existing-product-understanding-engine.js";
import { ExistingProductScanner } from "../existing-product-scanner.js";

describe("AEGIS Phase 56 — Change Contract Engine", () => {
  it("generates formal ProductChangeContract mapping affected features and acceptance criteria", () => {
    const inventory = ExistingProductScanner.scan();
    const arch = ExistingProductUnderstandingEngine.understand("GymMaster Pro", inventory);
    const interpreted = ChangeRequestInterpreter.interpret("Add online payments");

    const contract = ChangeContractEngine.generateContract(interpreted, arch);

    expect(contract.affectedFeatures.length).toBeGreaterThan(0);
    expect(contract.affectedEntities).toContain("Payment");
    expect(contract.affectedRoutes.some((r) => r.includes("/api/payments"))).toBe(true);
    expect(contract.acceptanceCriteria.length).toBeGreaterThan(0);
  });
});
