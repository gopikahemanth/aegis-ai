import { describe, it, expect } from "vitest";
import { ExecutionResourceGovernanceEngine } from "../execution-resource-governance.js";

describe("AEGIS Phase 33 — Execution Resource Governance Engine", () => {
  it("allows execution within normal token and compute budget", () => {
    const rep = ExecutionResourceGovernanceEngine.checkBudget("exec_1", 20000, 100000, 2000, 10000);
    expect(rep.status).toBe("NORMAL");
    expect(rep.isBlocked).toBe(false);
  });

  it("blocks execution when budget limit is reached", () => {
    const rep = ExecutionResourceGovernanceEngine.checkBudget("exec_1", 105000, 100000, 5000, 10000);
    expect(rep.status).toBe("LIMIT_REACHED");
    expect(rep.isBlocked).toBe(true);
  });
});
