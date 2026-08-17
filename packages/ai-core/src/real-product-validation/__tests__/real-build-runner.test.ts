import { describe, it, expect } from "vitest";
import { RealBuildRunner } from "../real-build-runner.js";

describe("AEGIS Phase 47 — Real Build Runner", () => {
  it("executes installation, typechecking, bundling, and testing on real generated projects without fabricated success", () => {
    const report = RealBuildRunner.executeRealBuild("./dist/gym-app");

    expect(report.status).toBe("BUILD_PASSED");
    expect(report.steps.length).toBe(4);
    expect(report.artifacts).toContain("dist/index.html");
    expect(report.totalDurationMs).toBeGreaterThan(0);
    expect(report.errors.length).toBe(0);
  });
});
