import { describe, it, expect } from "vitest";
import { DependencySecurityEngine } from "../dependency-security-engine.js";

describe("AEGIS Phase 58 — Dependency Security Engine", () => {
  it("audits direct and transitive dependencies and confirms 0 known high/critical CVEs", () => {
    const report = DependencySecurityEngine.auditDependencies();
    expect(report.isDependenciesSecure).toBe(true);
    expect(report.totalDependenciesScanned).toBeGreaterThan(50);
    expect(report.criticalCount).toBe(0);
  });
});
