import { describe, it, expect } from "vitest";
import { ProductionDatabaseEngine } from "../production-database-engine.js";

describe("AEGIS Phase 54 — Production Database Engine", () => {
  it("verifies connection, schema, migrations, CRUD, and backup capability", () => {
    const res = ProductionDatabaseEngine.verifyDatabase();
    expect(res.isDatabaseReady).toBe(true);
    expect(res.isRecoveryReady).toBe(true);
    expect(res.crudRoundtripPassed).toBe(true);
    expect(res.backupCapabilityVerified).toBe(true);
    expect(res.restoreCapabilityVerified).toBe(true);
  });

  it("distinguishes isDatabaseReady from isRecoveryReady when restore fails", () => {
    const res = ProductionDatabaseEngine.verifyDatabase({ simulateRestoreFailure: true });
    expect(res.isDatabaseReady).toBe(true);
    expect(res.isRecoveryReady).toBe(false);
    expect(res.restoreCapabilityVerified).toBe(false);
  });

  it("fails when connection pool cannot connect", () => {
    const res = ProductionDatabaseEngine.verifyDatabase({ simulateConnectionFailure: true });
    expect(res.isDatabaseReady).toBe(false);
    expect(res.schemaApplied).toBe(false);
  });
});
