/**
 * transactional-rollback.test.ts
 *
 * Tests atomic multi-file checkpoints, exact content rollback,
 * and repeated repair failure detection (REPEATED_REPAIR_FAILURE).
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { TransactionalRepairSystem } from "../transactional-repair.js";

const TEST_DIR = join(process.cwd(), ".tmp_test_rollback");

describe("TransactionalRepairSystem — Atomic Multi-File Rollback", () => {
  beforeEach(() => {
    TransactionalRepairSystem.reset();
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
    TransactionalRepairSystem.reset();
  });

  it("creates checkpoint and restores exact original file contents on rollback", () => {
    const fileA = "src/A.ts";
    const fileB = "src/B.tsx";
    const newFileC = "src/C.ts";

    mkdirSync(join(TEST_DIR, "src"), { recursive: true });
    const originalContentA = `export const A = "Original A";\nconsole.log("A");`;
    const originalContentB = `export const B = () => <div>Original B</div>;`;

    writeFileSync(join(TEST_DIR, fileA), originalContentA, "utf8");
    writeFileSync(join(TEST_DIR, fileB), originalContentB, "utf8");

    // 1. Create checkpoint for A, B, and a prospective new file C
    const checkpointId = TransactionalRepairSystem.createCheckpoint(
      TEST_DIR,
      [fileA, fileB, newFileC],
      {
        repairId: "rep_101",
        failureType: "TYPE_ERROR",
        rootCause: "Props mismatch",
        attemptNumber: 1,
      }
    );

    expect(checkpointId).toBeTruthy();
    const checkpoint = TransactionalRepairSystem.getCheckpoint(checkpointId);
    expect(checkpoint?.backupFiles[fileA]).toBe(originalContentA);
    expect(checkpoint?.backupFiles[fileB]).toBe(originalContentB);
    expect(checkpoint?.backupFiles[newFileC]).toBe("__NEW_FILE__");

    // 2. Simulate bad repair changes
    writeFileSync(join(TEST_DIR, fileA), `export const A = "Corrupted A";`, "utf8");
    writeFileSync(join(TEST_DIR, fileB), `export const B = () => <div>Broken B</div>;`, "utf8");
    writeFileSync(join(TEST_DIR, newFileC), `export const C = "New unwanted file";`, "utf8");

    // 3. Rollback
    const rolledBack = TransactionalRepairSystem.rollback(
      TEST_DIR,
      checkpointId,
      "Validation failed on B.tsx"
    );

    expect(rolledBack).toBe(true);

    // 4. Verify all files restored exactly
    expect(readFileSync(join(TEST_DIR, fileA), "utf8")).toBe(originalContentA);
    expect(readFileSync(join(TEST_DIR, fileB), "utf8")).toBe(originalContentB);
    expect(existsSync(join(TEST_DIR, newFileC))).toBe(false); // New file deleted
  });

  it("commits checkpoint and records attempt history on success", () => {
    const fileA = "src/Service.ts";
    mkdirSync(join(TEST_DIR, "src"), { recursive: true });
    writeFileSync(join(TEST_DIR, fileA), "const x = 1;", "utf8");

    const checkpointId = TransactionalRepairSystem.createCheckpoint(TEST_DIR, [fileA], {
      repairId: "rep_success",
      rootCause: "Syntax fix",
    });

    writeFileSync(join(TEST_DIR, fileA), "export const x = 2;", "utf8");
    TransactionalRepairSystem.commit(checkpointId);

    const history = TransactionalRepairSystem.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].result).toBe("COMMITTED");
    expect(history[0].repairId).toBe("rep_success");
  });

  it("detects repeated repair attempts on the exact same root cause and files", () => {
    const files = ["src/Component.tsx"];

    // Attempt 1: fails
    const cp1 = TransactionalRepairSystem.createCheckpoint(TEST_DIR, files, { rootCause: "Missing export" });
    TransactionalRepairSystem.rollback(TEST_DIR, cp1, "Fail 1");

    // Attempt 2: fails
    const cp2 = TransactionalRepairSystem.createCheckpoint(TEST_DIR, files, { rootCause: "Missing export" });
    TransactionalRepairSystem.rollback(TEST_DIR, cp2, "Fail 2");

    // Attempt 3: check repeated repair
    const check = TransactionalRepairSystem.checkRepeatedRepair("Missing export", files);
    expect(check.isRepeated).toBe(true);
    expect(check.attemptCount).toBe(2);
    expect(check.reason).toContain("REPEATED_REPAIR_FAILURE");
  });

});
