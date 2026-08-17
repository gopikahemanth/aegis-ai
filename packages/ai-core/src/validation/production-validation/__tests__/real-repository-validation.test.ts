import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ManualChangeConflictResolver } from "../../../evolution/manual-change-conflict-resolver.js";

const REPO_DIR = join(process.cwd(), ".tmp_test_p19_repo");

describe("AEGIS Phase 19 — Real Repository Validation & Conflict Detection", () => {
  beforeEach(() => {
    if (existsSync(REPO_DIR)) rmSync(REPO_DIR, { recursive: true, force: true });
    mkdirSync(REPO_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(REPO_DIR)) rmSync(REPO_DIR, { recursive: true, force: true });
  });

  it("detects external manual modifications and halts evolution without silent overwrite", () => {
    const file = "server.ts";
    const full = join(REPO_DIR, file);
    writeFileSync(full, "// baseline code", "utf8");

    const baselineHash = ManualChangeConflictResolver.getFileHash(REPO_DIR, file)!;

    // External user modifies the file
    writeFileSync(full, "// user edited content", "utf8");

    const report = ManualChangeConflictResolver.evaluateFileChange(
      REPO_DIR,
      file,
      baselineHash,
      "// aegis generated content"
    );

    expect(report.status).toBe("USER_CHANGE_CONFLICT");
    expect(report.message).toContain("USER_CHANGE_CONFLICT");
  });
});
