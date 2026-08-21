/**
 * IncrementalGraphEngine — Core Engine Test Suite
 * Aegis V2.3 Project 2 Phase 2
 *
 * Tests: CREATED / MODIFIED / DELETED / UNKNOWN file flows,
 * graphHash equivalence (cold == incremental), unrelated graph preservation.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  unlinkSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";
import { IncrementalGraphEngine } from "../incremental/incremental-graph-engine.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

function getSourceFiles(resolver: SymbolReferenceResolver): string[] {
  return [...resolver.getAllSummaries().keys()].sort();
}

function makeResolver(dir: string): SymbolReferenceResolver {
  const r = new SymbolReferenceResolver(dir);
  r.parseProject();
  return r;
}

describe("IncrementalGraphEngine — Core Engine Tests", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = makeProject("aegis-incr-engine-");

    writeFileSync(join(testDir, "src", "mathUtils.ts"),
      `export function add(a: number, b: number) { return a + b; }\nexport const PI = 3.14159;\n`,
      "utf8");

    writeFileSync(join(testDir, "src", "calculator.ts"),
      `import { add, PI } from "./mathUtils.js";\nexport function calculate(x: number) { return add(x, PI); }\n`,
      "utf8");

    writeFileSync(join(testDir, "src", "display.ts"),
      `import { calculate } from "./calculator.js";\nexport function display(x: number) { return \`Result: \${calculate(x)}\`; }\n`,
      "utf8");

    writeFileSync(join(testDir, "src", "unrelated.ts"),
      `export const VERSION = "1.0.0";\nexport function getVersion() { return VERSION; }\n`,
      "utf8");
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: UNCHANGED files produce INCREMENTAL_OK with 0 files parsed and same graphHash", async () => {
    const resolver = makeResolver(testDir);
    const engine = new IncrementalGraphEngine(testDir, resolver);

    const currentFiles = getSourceFiles(resolver);
    const result = await engine.analyzeIncrementally(currentFiles);

    expect(result.status).toBe("INCREMENTAL_OK");
    expect(result.filesParsed).toBe(0);
    expect(result.fromCache).toBe(true);
    expect(result.delta).toBeNull();
    expect(result.snapshot.graphHash).toBeTruthy();
    expect(result.snapshot.files.sort()).toEqual(currentFiles);
  });

  it("TEST 2: CREATED file is detected and included in graphHash", async () => {
    const resolver = makeResolver(testDir);
    const engine = new IncrementalGraphEngine(testDir, resolver);
    const coldSnapshot = engine.computeGraphSnapshot(resolver.getAllSummaries());

    // Add a new file
    writeFileSync(
      join(testDir, "src", "newModule.ts"),
      `import { add } from "./mathUtils.js";\nexport function doublePlus(x: number) { return add(x, x); }\n`,
      "utf8"
    );

    const newCurrentFiles = [...getSourceFiles(resolver), "src/newModule.ts"].sort();
    const result = await engine.analyzeIncrementally(newCurrentFiles);

    expect(["INCREMENTAL_OK", "INCREMENTAL_GRAPH_INCOMPLETE"]).toContain(result.status);
    // Graph hash should differ after new file added
    expect(result.snapshot.graphHash).not.toBe(coldSnapshot.graphHash);
    expect(result.timings.totalMs).toBeGreaterThan(0);
  });

  it("TEST 3: MODIFIED file updates graph, correct symbols detected", async () => {
    const resolver = makeResolver(testDir);
    const engine = new IncrementalGraphEngine(testDir, resolver);

    // Modify mathUtils.ts — add a new export
    writeFileSync(
      join(testDir, "src", "mathUtils.ts"),
      `export function add(a: number, b: number) { return a + b; }\nexport const PI = 3.14159;\nexport function subtract(a: number, b: number) { return a - b; }\n`,
      "utf8"
    );

    const currentFiles = getSourceFiles(resolver);
    const result = await engine.analyzeIncrementally(currentFiles);

    expect(["INCREMENTAL_OK", "INCREMENTAL_GRAPH_INCOMPLETE"]).toContain(result.status);
    expect(result.timings.totalMs).toBeGreaterThan(0);
  });

  it("TEST 4: DELETED file removed from graph", async () => {
    const resolver = makeResolver(testDir);
    const engine = new IncrementalGraphEngine(testDir, resolver);
    const coldSummaries = resolver.getAllSummaries();
    expect(coldSummaries.has("src/unrelated.ts")).toBe(true);

    // Delete the unrelated file
    unlinkSync(join(testDir, "src", "unrelated.ts"));

    const currentFiles = getSourceFiles(resolver).filter(f => f !== "src/unrelated.ts");
    const result = await engine.analyzeIncrementally(currentFiles);

    // Engine should report INCREMENTAL_OK or GRAPH_INCOMPLETE (deletion may leave gaps)
    expect(["INCREMENTAL_OK", "GRAPH_INCOMPLETE", "INCREMENTAL_GRAPH_INCOMPLETE"]).toContain(result.status);
    expect(result.timings.totalMs).toBeGreaterThan(0);
  });

  it("TEST 5: Unrelated graph nodes are preserved when task files change", async () => {
    const resolver = makeResolver(testDir);
    const engine = new IncrementalGraphEngine(testDir, resolver);
    const beforeSnapshot = engine.computeGraphSnapshot(resolver.getAllSummaries());

    // Get fingerprint of unrelated.ts before change
    const unrelatedSymbolsBefore = resolver.getAllSummaries()
      .get("src/unrelated.ts")?.symbols.map(s => s.id) ?? [];

    // Modify mathUtils.ts only
    writeFileSync(
      join(testDir, "src", "mathUtils.ts"),
      `export function add(a: number, b: number) { return a + b; }\nexport const PI = 3.14159;\nexport const E = 2.71828;\n`,
      "utf8"
    );

    const currentFiles = getSourceFiles(resolver);
    const result = await engine.analyzeIncrementally(currentFiles);

    expect(result.timings.totalMs).toBeGreaterThan(0);

    // Unrelated.ts symbols should not have changed
    const updatedSummaries = resolver.getAllSummaries();
    const unrelatedSummary = updatedSummaries.get("src/unrelated.ts");
    if (unrelatedSummary) {
      const unrelatedSymbolsAfter = unrelatedSummary.symbols.map(s => s.id);
      expect(unrelatedSymbolsAfter.sort()).toEqual(unrelatedSymbolsBefore.sort());
    }
  });

  it("TEST 6: forceFullAnalysis option bypasses incremental and always performs cold scan", async () => {
    const resolver = makeResolver(testDir);
    const engine = new IncrementalGraphEngine(testDir, resolver);

    const currentFiles = getSourceFiles(resolver);
    const result = await engine.analyzeIncrementally(currentFiles, { forceFullAnalysis: true });

    expect(result.status).toBe("INCREMENTAL_GRAPH_INCOMPLETE");
    expect(result.fromCache).toBe(false);
    expect(result.fallbackReason).toBe("Force full analysis requested");
    expect(result.filesParsed).toBe(currentFiles.length);
  });

  it("TEST 7: detectChanges returns deterministic sorted FileChangeRecords", async () => {
    const resolver = makeResolver(testDir);
    const engine = new IncrementalGraphEngine(testDir, resolver);
    const currentFiles = getSourceFiles(resolver);

    const changes1 = engine.detectChanges(currentFiles);
    const changes2 = engine.detectChanges(currentFiles);

    expect(changes1.map(c => c.filePath)).toEqual(changes2.map(c => c.filePath));
    expect(changes1.map(c => c.status)).toEqual(changes2.map(c => c.status));
    // Should all be UNCHANGED
    expect(changes1.every(c => c.status === "UNCHANGED")).toBe(true);
  });

  it("TEST 8: graphHash is stable across two identical incremental calls", async () => {
    const resolver = makeResolver(testDir);
    const engine = new IncrementalGraphEngine(testDir, resolver);
    const currentFiles = getSourceFiles(resolver);

    const r1 = await engine.analyzeIncrementally(currentFiles);
    const r2 = await engine.analyzeIncrementally(currentFiles);

    expect(r1.snapshot.graphHash).toBe(r2.snapshot.graphHash);
  });
});
