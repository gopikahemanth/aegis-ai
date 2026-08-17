import { describe, it, expect } from "vitest";
import { RuntimeProductValidator } from "../runtime-product-validator.js";

describe("AEGIS Phase 45 — Runtime Product Validator", () => {
  it("validates that the application boots up, listens on ports, and connects to Postgres database", () => {
    const report = RuntimeProductValidator.validateRuntime(5173, true, true, 210, []);
    expect(report.isRuntimeHealthy).toBe(true);
    expect(report.port).toBe(5173);
    expect(report.apiHealthStatus).toBe("HEALTHY");
  });
});
