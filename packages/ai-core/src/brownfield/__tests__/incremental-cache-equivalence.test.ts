/**
 * IncrementalCacheEquivalence Test Suite — Aegis V2.3 Project 2 Phase 2
 *
 * Tests:
 * - Cold analysis == Incremental analysis equivalence
 * - Identical symbol table and reverse dependency index output
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

function setupRepository(dir: string) {
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");

  writeFileSync(join(dir, "src", "math.ts"), `export function add(a: number, b: number) { return a + b; }\n`, "utf8");
  writeFileSync(join(dir, "src", "calc.ts"), `import { add } from "./math.js";\nexport function compute(x: number) { return add(x, 10); }\n`, "utf8");
}

describe("IncrementalCacheEquivalence Tests", () => {
  let coldDir: string;
  let incDir: string;

  beforeEach(() => {
    coldDir = mkdtempSync(join(tmpdir(), "aegis-cold-eq-"));
    incDir = mkdtempSync(join(tmpdir(), "aegis-inc-eq-"));

    setupRepository(coldDir);
    setupRepository(incDir);

    // Baseline cold parse on incDir
    const initialResolver = new SymbolReferenceResolver(incDir);
    initialResolver.parseProject();
  });

  afterEach(() => {
    try { rmSync(coldDir, { recursive: true, force: true }); } catch {}
    try { rmSync(incDir, { recursive: true, force: true }); } catch {}
  });

  it("TEST 1: Incremental update produces identical symbol entries to fresh cold parse", () => {
    // Mutate math.ts in both repositories identically
    const updatedCode = `export function add(a: number, b: number) { return a + b + 1; }\nexport function multiply(a: number, b: number) { return a * b; }\n`;
    writeFileSync(join(coldDir, "src", "math.ts"), updatedCode, "utf8");
    writeFileSync(join(incDir, "src", "math.ts"), updatedCode, "utf8");

    // Cold analysis on coldDir
    const coldResolver = new SymbolReferenceResolver(coldDir);
    coldResolver.parseProject();
    const coldCache = new PersistentAstCache(coldDir);
    const coldSymbols = (coldCache.loadSymbolTable() || []).map(s => `${s.filePath}#${s.symbolName}`).sort();

    // Incremental analysis on incDir
    const incCache = new PersistentAstCache(incDir);
    incCache.init();
    const detector = new IncrementalChangeDetector(incDir, incCache);
    const report = detector.detectChanges();
    const invEngine = new DependencyInvalidationEngine(incCache);
    const impact = invEngine.computeImpact(report);
    const updater = new IncrementalGraphUpdater(incDir, incCache);
    updater.updateGraph(impact);

    const incSymbols = (incCache.loadSymbolTable() || []).map(s => `${s.filePath}#${s.symbolName}`).sort();

    expect(incSymbols).toEqual(coldSymbols);
    expect(incSymbols.length).toBeGreaterThan(0);
  });
});
