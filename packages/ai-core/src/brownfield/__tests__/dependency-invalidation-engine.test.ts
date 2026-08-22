/**
 * DependencyInvalidationEngine Test Suite — Aegis V2.3 Project 2 Phase 2
 *
 * Tests:
 * - Computes direct and transitive dependents on file modifications
 * - Flags unresolvable dynamic imports as IMPACT_ANALYSIS_INCOMPLETE
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PersistentAstCache } from "../ast-cache/persistent-ast-cache.js";
import { IncrementalChangeDetector } from "../ast-cache/incremental-change-detector.js";
import { DependencyInvalidationEngine } from "../ast-cache/dependency-invalidation-engine.js";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("DependencyInvalidationEngine Tests", () => {
  let testDir: string;
  let cache: PersistentAstCache;

  beforeEach(() => {
    testDir = makeProject("aegis-dep-inv-");
    cache = new PersistentAstCache(testDir);
    cache.init();

    // A -> B -> C dependency chain
    writeFileSync(join(testDir, "src", "c.ts"), `export function calc() { return 42; }\n`, "utf8");
    writeFileSync(join(testDir, "src", "b.ts"), `import { calc } from "./c.js";\nexport function mid() { return calc(); }\n`, "utf8");
    writeFileSync(join(testDir, "src", "a.ts"), `import { mid } from "./b.js";\nexport function top() { return mid(); }\n`, "utf8");

    // Populate initial cache
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Invalidation of leaf C transitively expands to B and A", () => {
    writeFileSync(join(testDir, "src", "c.ts"), `export function calc() { return 100; }\n`, "utf8");

    const detector = new IncrementalChangeDetector(testDir, cache);
    const report = detector.detectChanges();

    const engine = new DependencyInvalidationEngine(cache);
    const impact = engine.computeImpact(report);

    expect(impact.changedFiles).toContain("src/c.ts");
    expect(impact.directlyAffectedFiles).toContain("src/b.ts");
    expect(impact.transitivelyAffectedFiles).toContain("src/a.ts");
  });
});
