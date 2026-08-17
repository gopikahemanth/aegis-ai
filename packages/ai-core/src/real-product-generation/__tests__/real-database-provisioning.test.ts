import { describe, it, expect } from "vitest";
import { RealDatabaseProvisioner } from "../real-database-provisioner.js";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";

describe("AEGIS Phase 52 — Real Database Provisioner", () => {
  it("generates schema, runs migration, verifies connection, and confirms real CRUD persistence", () => {
    const tmpDir = path.join(os.tmpdir(), "aegis-db-test");
    fs.mkdirSync(tmpDir, { recursive: true });

    const result = RealDatabaseProvisioner.provision(tmpDir, ["User", "Member", "Attendance"]);

    expect(result.isFullyVerified).toBe(true);
    expect(result.state).toBe("PERSISTENCE_VERIFIED");
    expect(result.schemaGenerated).toBe(true);
    expect(result.migrationRan).toBe(true);
    expect(result.connectionVerified).toBe(true);
    expect(result.persistenceVerified).toBe(true);
    expect(result.transactionBoundariesVerified).toBe(true);
    expect(result.schemaPath).toBeDefined();
    expect(fs.existsSync(result.schemaPath!)).toBe(true);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("reports failure when simulation is enabled — enforcing DATABASE SCHEMA != DATABASE VERIFIED", () => {
    const tmpDir = path.join(os.tmpdir(), "aegis-db-fail-test");
    fs.mkdirSync(tmpDir, { recursive: true });

    const result = RealDatabaseProvisioner.provision(tmpDir, ["User"], true);

    expect(result.isFullyVerified).toBe(false);
    expect(result.state).toBe("FAILED");
    expect(result.persistenceVerified).toBe(false);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
