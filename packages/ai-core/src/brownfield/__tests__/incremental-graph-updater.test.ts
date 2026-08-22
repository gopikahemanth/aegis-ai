/**
 * IncrementalGraphUpdater Test Suite — Aegis V2.3 Project 2 Phase 2
 *
 * Tests:
 * - Updates only modified file records and indexes
 * - Preserves unaffected file records and symbol entries
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PersistentAstCache } from "../ast-cache/persistent-ast-cache.js";
import { IncrementalChangeDetector } from "../ast-cache/incremental-change-detector.js";
import { DependencyInvalidationEngine } from "../ast-cache/dependency-invalidation-engine.js";
import { IncrementalGraphUpdater } from "../ast-cache/incremental-graph-updater.js";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("IncrementalGraphUpdater Tests", () => {
  let testDir: string;
  let cache: PersistentAstCache;

  beforeEach(() => {
    testDir = makeProject("aegis-graph-upd-");
    cache = new PersistentAstCache(testDir);
    cache.init();

    writeFileSync(join(testDir, "src", "a.ts"), `export function foo() { return 1; }\n`, "utf8");
    writeFileSync(join(testDir, "src", "b.ts"), `export function bar() { return 2; }\n`, "utf8");

    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Incremental update parses only changed file and updates symbol index", () => {
    writeFileSync(join(testDir, "src", "a.ts"), `export function fooUpdated() { return 10; }\n`, "utf8");

    const detector = new IncrementalChangeDetector(testDir, cache);
    const report = detector.detectChanges();

    const invEngine = new DependencyInvalidationEngine(cache);
    const impact = invEngine.computeImpact(report);

    const updater = new IncrementalGraphUpdater(testDir, cache);
    const result = updater.updateGraph(impact);

    expect(result.success).toBe(true);
    expect(result.metrics.filesParsed).toBe(1);
    expect(result.metrics.graphNodesPreserved).toBeGreaterThanOrEqual(1);

    const symbols = cache.loadSymbolTable() || [];
    const symbolNames = symbols.map(s => s.symbolName);
    expect(symbolNames).toContain("fooUpdated");
    expect(symbolNames).toContain("bar");
  });
});
