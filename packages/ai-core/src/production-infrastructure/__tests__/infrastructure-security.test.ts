import { describe, it, expect } from "vitest";
import { InfrastructureSecurityEngine } from "../infrastructure-security-engine.js";

describe("AEGIS Phase 54 — Infrastructure Security Engine", () => {
  it("audits perimeter security and confirms no critical leaks", () => {
    const res = InfrastructureSecurityEngine.auditPerimeter();
    expect(res.isSecure).toBe(true);
    expect(res.criticalFailures).toHaveLength(0);
    expect(res.disclaimer).toContain("DISCLAIMER");
  });

  it("fails and detects critical security breach when database is exposed publicly", () => {
    const res = InfrastructureSecurityEngine.auditPerimeter({ simulateFailure: "Direct Database Exposure Blocked" });
    expect(res.isSecure).toBe(false);
    expect(res.overallState).toBe("FAILED");
    expect(res.criticalFailures).toContain("Direct Database Exposure Blocked");
  });
});
