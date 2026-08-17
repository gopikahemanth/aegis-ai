import { describe, it, expect } from "vitest";
import { ExistingProductUnderstandingEngine } from "../existing-product-understanding-engine.js";
import { ExistingProductScanner } from "../existing-product-scanner.js";

describe("AEGIS Phase 56 — Existing Product Understanding Engine", () => {
  it("builds structural architecture mapping entities, relations, pages, and workflows", () => {
    const inventory = ExistingProductScanner.scan();
    const arch = ExistingProductUnderstandingEngine.understand("GymMaster Pro", inventory);

    expect(arch.entities).toContain("Member");
    expect(arch.entities).toContain("MembershipPlan");
    expect(arch.relationships.length).toBeGreaterThan(0);
    expect(arch.apiEndpoints.length).toBeGreaterThan(0);
    expect(arch.businessWorkflows).toContain("Daily Attendance Check-In & Validation");
  });
});
