import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ManualChangeConflictResolver } from "../manual-change-conflict-resolver.js";

const CONFLICT_DIR = join(process.cwd(), ".tmp_test_manual_conflict");

describe("ManualChangeConflictResolver", () => {
  beforeEach(() => {
    if (existsSync(CONFLICT_DIR)) rmSync(CONFLICT_DIR, { recursive: true, force: true });
    mkdirSync(CONFLICT_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(CONFLICT_DIR)) rmSync(CONFLICT_DIR, { recursive: true, force: true });
  });

  it("detects clean change when file on disk matches baseline", () => {
    const file = "src/components/Dashboard.tsx";
    const full = join(CONFLICT_DIR, file);
    mkdirSync(join(CONFLICT_DIR, "src/components"), { recursive: true });
    writeFileSync(full, "export const Dashboard = () => <div>Original</div>;", "utf8");

    const baselineHash = ManualChangeConflictResolver.getFileHash(CONFLICT_DIR, file)!;

    const report = ManualChangeConflictResolver.evaluateFileChange(
      CONFLICT_DIR,
      file,
      baselineHash,
      "export const Dashboard = () => <div>Updated by AEGIS</div>;"
    );

    expect(report.status).toBe("CLEAN");
    expect(report.resolutionStrategy).toBe("PROCEED_SAFE");
  });

  it("detects USER_CHANGE_CONFLICT when user manually modified file and AEGIS proposes different change", () => {
    const file = "src/components/Dashboard.tsx";
    const full = join(CONFLICT_DIR, file);
    mkdirSync(join(CONFLICT_DIR, "src/components"), { recursive: true });
    writeFileSync(full, "export const Dashboard = () => <div>Original</div>;", "utf8");

    const baselineHash = ManualChangeConflictResolver.getFileHash(CONFLICT_DIR, file)!;

    // User manually edits the file
    writeFileSync(full, "export const Dashboard = () => <div>Manual User Edit</div>;", "utf8");

    // AEGIS proposes a different change
    const report = ManualChangeConflictResolver.evaluateFileChange(
      CONFLICT_DIR,
      file,
      baselineHash,
      "export const Dashboard = () => <div>AEGIS Proposed Edit</div>;"
    );

    expect(report.status).toBe("USER_CHANGE_CONFLICT");
    expect(report.resolutionStrategy).toBe("MERGE_REQUIRED");
    expect(report.message).toContain("USER_CHANGE_CONFLICT");
  });
});
