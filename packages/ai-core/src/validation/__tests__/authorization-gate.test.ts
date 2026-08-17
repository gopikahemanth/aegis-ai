import { describe, it, expect } from "vitest";
import { AuthorizationGate } from "../authorization-gate.js";

describe("AuthorizationGate", () => {
  it("allows safe autonomous operations and stops at authorization boundaries", () => {
    // 1. Safe autonomous operation
    const safeOp = AuthorizationGate.evaluateOperation("Add member search filter", {});
    expect(safeOp.allowed).toBe(true);
    expect(safeOp.status).toBe("AUTHORIZED");

    // 2. Destructive DB migration -> requires authorization
    const destructiveOp = AuthorizationGate.evaluateOperation("Drop users table", {
      isDestructiveDatabaseMigration: true,
    });
    expect(destructiveOp.allowed).toBe(false);
    expect(destructiveOp.status).toBe("AWAITING_AUTHORIZATION");
    expect(destructiveOp.message).toContain("AWAITING_AUTHORIZATION");

    // 3. Architecture migration -> requires authorization
    const archOp = AuthorizationGate.evaluateOperation("Migrate to Next.js", {
      isArchitectureMigration: true,
    });
    expect(archOp.allowed).toBe(false);
    expect(archOp.status).toBe("AWAITING_AUTHORIZATION");
  });
});
