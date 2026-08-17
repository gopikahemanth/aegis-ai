import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ProjectStateIntegrityValidator } from "../project-state-integrity-validator.js";

const INTEGRITY_DIR = join(process.cwd(), ".tmp_test_integrity");

describe("ProjectStateIntegrityValidator", () => {
  beforeEach(() => {
    if (existsSync(INTEGRITY_DIR)) rmSync(INTEGRITY_DIR, { recursive: true, force: true });
    mkdirSync(INTEGRITY_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(INTEGRITY_DIR)) rmSync(INTEGRITY_DIR, { recursive: true, force: true });
  });

  it("detects corrupted project metadata JSON and safely recovers state from reality", () => {
    const aegisDir = join(INTEGRITY_DIR, ".aegis");
    mkdirSync(aegisDir, { recursive: true });

    // Intentionally corrupt project-intelligence.json
    writeFileSync(join(aegisDir, "project-intelligence.json"), "CORRUPTED { INVALID_JSON @@@", "utf8");

    const result = ProjectStateIntegrityValidator.validateAndRecover(INTEGRITY_DIR);
    expect(result.valid).toBe(true);
    expect(result.recovered).toBe(true);
    expect(result.corruptedFiles).toContain("project-intelligence.json");
    expect(result.repairedFiles).toContain("project-intelligence.json");
  });
});
