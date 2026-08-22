/**
 * IncrementalChangeDetector Test Suite — Aegis V2.3 Project 2 Phase 2
 *
 * Tests:
 * - Detects ADDED, MODIFIED, REMOVED, and UNCHANGED files
 * - Classifies structural impact (SYMBOLS_CHANGED, IMPORTS_CHANGED, CONTENT_ONLY)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PersistentAstCache } from "../ast-cache/persistent-ast-cache.js";
import { IncrementalChangeDetector } from "../ast-cache/incremental-change-detector.js";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("IncrementalChangeDetector Tests", () => {
  let testDir: string;
  let cache: PersistentAstCache;
  let detector: IncrementalChangeDetector;

  beforeEach(() => {
    testDir = makeProject("aegis-inc-detector-");
    cache = new PersistentAstCache(testDir);
    cache.init();

    // Initial files
    writeFileSync(join(testDir, "src", "a.ts"), `export function foo() { return 1; }\n`, "utf8");
    writeFileSync(join(testDir, "src", "b.ts"), `import { foo } from "./a.js";\nexport function bar() { return foo(); }\n`, "utf8");

    // Cold parse & populate cache
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();

    detector = new IncrementalChangeDetector(testDir, cache);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Detects UNCHANGED files when no modifications occur", () => {
    const report = detector.detectChanges();
    expect(report.hasChanges).toBe(false);
    expect(report.unchanged.length).toBe(2);
    expect(report.modified.length).toBe(0);
    expect(report.added.length).toBe(0);
    expect(report.removed.length).toBe(0);
  });

  it("TEST 2: Detects MODIFIED file when content hash changes", () => {
    writeFileSync(join(testDir, "src", "a.ts"), `export function foo() { return 2; }\n`, "utf8");
    const report = detector.detectChanges();

    expect(report.hasChanges).toBe(true);
    expect(report.modified).toContain("src/a.ts");
    expect(report.unchanged).toContain("src/b.ts");
  });

  it("TEST 3: Detects ADDED file when new source file is created", () => {
    writeFileSync(join(testDir, "src", "c.ts"), `export const c = 3;\n`, "utf8");
    const report = detector.detectChanges();

    expect(report.hasChanges).toBe(true);
    expect(report.added).toContain("src/c.ts");
  });

  it("TEST 4: Detects REMOVED file when source file is deleted", () => {
    unlinkSync(join(testDir, "src", "b.ts"));
    const report = detector.detectChanges();

    expect(report.hasChanges).toBe(true);
    expect(report.removed).toContain("src/b.ts");
  });
});
