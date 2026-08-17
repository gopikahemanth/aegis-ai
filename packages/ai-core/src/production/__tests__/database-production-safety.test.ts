import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { DatabaseProductionSafetyManager } from "../database-production-safety.js";

const DB_TEST_DIR = join(process.cwd(), ".tmp_test_p14_db");

describe("AEGIS Phase 14 — Database Production Safety & Backup Verification", () => {
  beforeEach(() => {
    if (existsSync(DB_TEST_DIR)) rmSync(DB_TEST_DIR, { recursive: true, force: true });
    mkdirSync(join(DB_TEST_DIR, "prisma"), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(DB_TEST_DIR)) rmSync(DB_TEST_DIR, { recursive: true, force: true });
  });

  it("detects destructive model drop, flags authorization required, and creates verified backup", () => {
    const oldSchema = "model User { id Int @id }\nmodel Member { id Int @id }";
    const newSchema = "model User { id Int @id }"; // Member model dropped

    writeFileSync(join(DB_TEST_DIR, "prisma", "schema.prisma"), oldSchema, "utf8");

    const report = DatabaseProductionSafetyManager.evaluateMigrationSafety(
      DB_TEST_DIR,
      "gym_proj",
      oldSchema,
      newSchema
    );

    expect(report.classification).toBe("DESTRUCTIVE");
    expect(report.requiresAuthorization).toBe(true);
    expect(report.backupCreated).toBe(true);
    expect(existsSync(report.backupRecord!.backupPath)).toBe(true);
  });
});
