import { describe, it, expect, beforeEach } from "vitest";
import { UsageGovernance } from "../usage-governance.js";

describe("AEGIS Phase 21 — Enterprise Usage Governance", () => {
  beforeEach(() => {
    UsageGovernance.reset();
  });

  it("monitors consumption against organizational token and job quotas", () => {
    UsageGovernance.setQuota({
      organizationId: "org_acme",
      monthlyTokenBudget: 100_000,
      tokensConsumed: 20_000,
      monthlyJobLimit: 50,
      jobsExecuted: 10,
    });

    const report = UsageGovernance.checkQuota("org_acme");
    expect(report.quotaStatus).toBe("WITHIN_LIMITS");
    expect(report.tokensRemaining).toBe(80_000);
    expect(report.jobsRemaining).toBe(40);
  });
});
