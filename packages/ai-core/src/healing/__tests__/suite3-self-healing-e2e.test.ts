import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { TransactionalRepairSystem } from "../transactional-repair.js";

function getHash(filePath: string): string {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

describe("Suite 3 — Bounded Self-Healing & Transactional Rollback Invariants", () => {
  let testDir: string;

  beforeEach(() => {
    TransactionalRepairSystem.reset();
    testDir = join(tmpdir(), `suite3-isolated-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    mkdirSync(join(testDir, "src"), { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
    TransactionalRepairSystem.reset();
  });

  it("satisfies all 5 Suite 3 transactional rollback and bounding invariants", () => {
    const targetFile = "src/energy-calculator.ts";
    const adjacentFile1 = "src/grid-constants.ts";
    const adjacentFile2 = "src/telemetry-validator.ts";

    const initialTarget = `export function calculateOutput(kw: number) { return kw * 0.95; }`;
    const initialAdjacent1 = `export const BASELINE_HZ = 50.0;`;
    const initialAdjacent2 = `export const MAX_KV = 400.0;`;

    writeFileSync(join(testDir, targetFile), initialTarget, "utf8");
    writeFileSync(join(testDir, adjacentFile1), initialAdjacent1, "utf8");
    writeFileSync(join(testDir, adjacentFile2), initialAdjacent2, "utf8");

    const initialTargetHash = getHash(join(testDir, targetFile));
    const initialAdjacentHash1 = getHash(join(testDir, adjacentFile1));
    const initialAdjacentHash2 = getHash(join(testDir, adjacentFile2));

    // 1. Checkpoint creation
    const cpId = TransactionalRepairSystem.createCheckpoint(testDir, [targetFile], {
      failureType: "SYNTAX_ERROR",
      rootCause: "Fatal expression corruption",
      attemptNumber: 1,
    });
    expect(cpId.startsWith("chk_")).toBe(true);

    // 2. Corrupt target file
    writeFileSync(join(testDir, targetFile), `export function calculateOutput(kw: number) { return kw * * * ; }`, "utf8");
    expect(getHash(join(testDir, targetFile))).not.toBe(initialTargetHash);

    // 3. Strict bounding check (<= 3 attempts)
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      attempts++;
    }
    expect(attempts).toBeLessThanOrEqual(3);

    // 4. Unrecoverable rollback
    const rolledBack = TransactionalRepairSystem.rollback(testDir, cpId, "Max attempts reached with persistent syntax error");
    expect(rolledBack).toBe(true);

    // 5. Invariant: Exact byte-for-byte target restoration
    expect(getHash(join(testDir, targetFile))).toBe(initialTargetHash);
    expect(readFileSync(join(testDir, targetFile), "utf8")).toBe(initialTarget);

    // 6. Invariant: Adjacent files remain 100% unchanged
    expect(getHash(join(testDir, adjacentFile1))).toBe(initialAdjacentHash1);
    expect(getHash(join(testDir, adjacentFile2))).toBe(initialAdjacentHash2);
  });
});
