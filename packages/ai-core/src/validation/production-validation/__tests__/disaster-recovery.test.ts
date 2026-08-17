import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { DatabaseProductionSafetyManager } from "../../../production/database-production-safety.js";

const DR_DIR = join(process.cwd(), ".tmp_test_p19_dr");

describe("AEGIS Phase 19 — Disaster Recovery & Backup Integrity", () => {
  beforeEach(() => {
    if (existsSync(DR_DIR)) rmSync(DR_DIR, { recursive: true, force: true });
    mkdirSync(join(DR_DIR, "prisma"), { recursive: true });
    writeFileSync(join(DR_DIR, "prisma", "schema.prisma"), "datasource db { provider = \"postgresql\" url = env(\"DATABASE_URL\") }", "utf8");
  });

  afterEach(() => {
    if (existsSync(DR_DIR)) rmSync(DR_DIR, { recursive: true, force: true });
  });

  it("creates verified pre-migration backup and validates restore readiness", () => {
    const backup = DatabaseProductionSafetyManager.createBackup(
      DR_DIR,
      "gym_proj"
    );

    expect(backup.verified).toBe(true);
    expect(existsSync(backup.backupPath)).toBe(true);
  });
});
