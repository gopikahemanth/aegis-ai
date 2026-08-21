/**
 * GraphDelta Determinism & Barrel Export Test Suite
 * Aegis V2.3 Project 2 Phase 2
 *
 * Tests: GraphDelta determinism, sorting invariants, barrel/re-export handling.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";
import { GraphDeltaBuilder } from "../incremental/graph-delta-builder.js";
import type { FileChangeRecord } from "../incremental/incremental-analysis-contract.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("GraphDeltaBuilder — Determinism & Barrel Exports", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = makeProject("aegis-graph-delta-");

    writeFileSync(join(testDir, "src", "alpha.ts"),
      `export function doAlpha() { return "alpha"; }\n`, "utf8");
    writeFileSync(join(testDir, "src", "beta.ts"),
      `export function doBeta() { return "beta"; }\n`, "utf8");
    writeFileSync(join(testDir, "src", "index.ts"),
      `export { doAlpha } from "./alpha.js";\nexport { doBeta } from "./beta.js";\n`, "utf8");
    writeFileSync(join(testDir, "src", "consumer.ts"),
      `import { doAlpha, doBeta } from "./index.js";\nexport function run() { return doAlpha() + doBeta(); }\n`, "utf8");
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: CREATED delta has deterministically sorted addedFiles and addedSymbols", () => {
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();
    const cache = resolver.getAstCache();
    const builder = new GraphDeltaBuilder(testDir, cache, resolver);

    const changes: FileChangeRecord[] = [
      { filePath: "src/zeta.ts", status: "CREATED", newContentHash: "abc" },
      { filePath: "src/alpha.ts", status: "CREATED", newContentHash: "def" },
    ];

    writeFileSync(join(testDir, "src", "zeta.ts"),
      `export const Z = "zeta";\n`, "utf8");

    const delta1 = builder.build(changes);
    const delta2 = builder.build(changes);

    expect(delta1.addedFiles).toEqual(delta2.addedFiles);
    expect(delta1.addedFiles).toEqual([...delta1.addedFiles].sort());
    expect(delta1.deltaHash).toBe(delta2.deltaHash);
  });

  it("TEST 2: MODIFIED delta removes old symbols and adds new symbols correctly", () => {
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();

    // Update alpha.ts to add a symbol
    writeFileSync(join(testDir, "src", "alpha.ts"),
      `export function doAlpha() { return "alpha"; }\nexport function doAlpha2() { return "alpha2"; }\n`, "utf8");

    const cache = resolver.getAstCache();
    const builder = new GraphDeltaBuilder(testDir, cache, resolver);

    const changes: FileChangeRecord[] = [
      { filePath: "src/alpha.ts", status: "MODIFIED", oldContentHash: "old", newContentHash: "new" },
    ];

    const delta = builder.build(changes);

    expect(delta.modifiedFiles).toContain("src/alpha.ts");
    // addedSymbols should include doAlpha2
    const addedNames = delta.addedSymbols.map(s => s.symbolName);
    expect(addedNames).toContain("doAlpha2");
    expect(delta.status).toBe("CLEAN");
  });

  it("TEST 3: DELETED delta marks status as GRAPH_INCOMPLETE", () => {
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();
    const cache = resolver.getAstCache();
    const builder = new GraphDeltaBuilder(testDir, cache, resolver);

    const changes: FileChangeRecord[] = [
      { filePath: "src/alpha.ts", status: "DELETED", oldContentHash: "abc" },
    ];

    const delta = builder.build(changes);

    expect(delta.deletedFiles).toContain("src/alpha.ts");
    expect(delta.status).toBe("GRAPH_INCOMPLETE");
  });

  it("TEST 4: UNKNOWN file status produces INCREMENTAL_GRAPH_INCOMPLETE immediately", () => {
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();
    const cache = resolver.getAstCache();
    const builder = new GraphDeltaBuilder(testDir, cache, resolver);

    const changes: FileChangeRecord[] = [
      { filePath: "src/mystery.ts", status: "UNKNOWN", reason: "Cannot classify" },
    ];

    const delta = builder.build(changes);

    expect(delta.status).toBe("INCREMENTAL_GRAPH_INCOMPLETE");
    expect(delta.reason).toContain("UNKNOWN");
  });

  it("TEST 5: Barrel (index.ts) re-exports are tracked as RE_EXPORT edges in addedEdges", () => {
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();

    // Add a new symbol to index.ts
    writeFileSync(join(testDir, "src", "gamma.ts"),
      `export function doGamma() { return "gamma"; }\n`, "utf8");
    writeFileSync(join(testDir, "src", "index.ts"),
      `export { doAlpha } from "./alpha.js";\nexport { doBeta } from "./beta.js";\nexport { doGamma } from "./gamma.js";\n`, "utf8");

    const cache = resolver.getAstCache();
    const builder = new GraphDeltaBuilder(testDir, cache, resolver);

    const changes: FileChangeRecord[] = [
      { filePath: "src/gamma.ts", status: "CREATED", newContentHash: "g1" },
      { filePath: "src/index.ts", status: "MODIFIED", oldContentHash: "i_old", newContentHash: "i_new" },
    ];

    const delta = builder.build(changes);

    expect(delta.addedFiles).toContain("src/gamma.ts");
    expect(delta.modifiedFiles).toContain("src/index.ts");
    // Should track re-export edge from index.ts → gamma.ts
    const reExportEdges = delta.addedEdges.filter((e: any) =>
      (e.kind === "RE_EXPORT" || e.kind === "WILDCARD_RE_EXPORT") && e.fromFile === "src/index.ts"
    );
    expect(reExportEdges.length).toBeGreaterThanOrEqual(1);
  });

  it("TEST 6: deltaHash differs between distinct deltas, same between identical inputs", () => {
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();
    const cache = resolver.getAstCache();
    const builder = new GraphDeltaBuilder(testDir, cache, resolver);

    const changesA: FileChangeRecord[] = [
      { filePath: "src/alpha.ts", status: "MODIFIED", oldContentHash: "a1", newContentHash: "a2" },
    ];

    writeFileSync(join(testDir, "src", "alpha.ts"),
      `export function doAlpha() { return "alpha-v2"; }\n`, "utf8");

    const deltaA1 = builder.build(changesA);
    const deltaA2 = builder.build(changesA);
    expect(deltaA1.deltaHash).toBe(deltaA2.deltaHash);

    const changesB: FileChangeRecord[] = [
      { filePath: "src/beta.ts", status: "MODIFIED", oldContentHash: "b1", newContentHash: "b2" },
    ];

    writeFileSync(join(testDir, "src", "beta.ts"),
      `export function doBeta() { return "beta-v2"; }\n`, "utf8");

    const deltaB = builder.build(changesB);
    expect(deltaA1.deltaHash).not.toBe(deltaB.deltaHash);
  });
});
