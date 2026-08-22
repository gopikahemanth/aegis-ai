/**
 * IncrementalCacheTransaction Test Suite — Aegis V2.3 Project 2 Phase 2
 *
 * Tests:
 * - Atomic cache rollback on failure
 * - Restoring exact previous cache state
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PersistentAstCache } from "../ast-cache/persistent-ast-cache.js";
import { IncrementalCacheTransaction } from "../ast-cache/incremental-cache-transaction.js";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("IncrementalCacheTransaction Tests", () => {
  let testDir: string;
  let cache: PersistentAstCache;

  beforeEach(() => {
    testDir = makeProject("aegis-tx-test-");
    cache = new PersistentAstCache(testDir);
    cache.init();

    writeFileSync(join(testDir, "src", "task.ts"), `export function executeTask() { return true; }\n`, "utf8");
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Injected failure during transaction rolls back cache to initial state", () => {
    const tx = new IncrementalCacheTransaction(cache);
    const initialRecord = cache.getFileRecord("src/task.ts")!;

    expect(() => {
      tx.execute(["src/task.ts"], () => {
        // Corrupt cache record during transaction
        cache.setFileRecord({
          ...initialRecord,
          contentHash: "corrupted_hash",
        });
        throw new Error("Simulated interruption during transaction");
      });
    }).toThrow("Simulated interruption");

    // Verify rollback restored initial hash
    const restoredRecord = cache.getFileRecord("src/task.ts")!;
    expect(restoredRecord.contentHash).toBe(initialRecord.contentHash);
  });
});
