import { describe, it, expect } from "vitest";
import { FailoverCoordinator } from "../failover-coordinator.js";

describe("AEGIS Phase 29 — Failover Coordinator", () => {
  it("enforces EXPECTED_TARGET === ACTUAL_TARGET identity match", () => {
    const valid = FailoverCoordinator.validateFailoverTarget("db_replica_secondary", "db_replica_secondary");
    expect(valid.status).toBe("VALIDATED");
    expect(valid.isIdentityMatched).toBe(true);

    const mismatch = FailoverCoordinator.validateFailoverTarget("db_replica_secondary", "db_staging_node");
    expect(mismatch.status).toBe("IDENTITY_MISMATCH");
    expect(mismatch.isIdentityMatched).toBe(false);
  });
});
