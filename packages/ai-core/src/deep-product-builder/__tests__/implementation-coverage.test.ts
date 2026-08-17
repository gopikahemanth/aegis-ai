import { describe, it, expect } from "vitest";
import { ImplementationCoverageEngine } from "../implementation-coverage-engine.js";

describe("AEGIS Phase 51 — Implementation Coverage Engine", () => {
  it("constructs end-to-end traceability matrices from requirements to live workflow evidence", () => {
    const features = [
      { id: "req_1", name: "User Registration", category: "AUTH", description: "", origin: "EXPLICIT" as const, isCritical: true, acceptanceCriteria: [] },
      { id: "req_2", name: "Product Checkout", category: "ECOMMERCE", description: "", origin: "EXPLICIT" as const, isCritical: true, acceptanceCriteria: [] },
    ];

    const matrix = ImplementationCoverageEngine.buildTraceabilityMatrix(features);
    expect(matrix.totalRequirements).toBe(2);
    expect(matrix.totalComplete).toBe(2);
    expect(matrix.coveragePercentage).toBe(100);
  });
});
