import { describe, it, expect } from "vitest";
import { CiProvider } from "../../../integrations/cicd/ci-provider.js";

describe("AEGIS Phase 19 — Real CI/CD Pipeline Gate Validation", () => {
  it("enforces gate passing for CI pipelines and blocks when verification fails", () => {
    const successCi = CiProvider.evaluateCi(true);
    expect(successCi.passed).toBe(true);
    expect(successCi.reasons.length).toBe(0);

    const blockedCi = CiProvider.evaluateCi(false);
    expect(blockedCi.passed).toBe(false);
    expect(blockedCi.reasons.length).toBeGreaterThan(0);
  });
});
