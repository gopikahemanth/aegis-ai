/**
 * ReverseDependencyIndex Test Suite
 * Aegis V2.3 Project 2 Phase 2
 *
 * Tests: index creation, updates, transitive BFS query, persistence, hash stability.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";
import { ReverseDependencyIndex } from "../incremental/reverse-dependency-index.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("ReverseDependencyIndex — Creation, Updates, Transitive Query", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = makeProject("aegis-rdx-");

    writeFileSync(join(testDir, "src", "base.ts"),
      `export const BASE = "base";\n`, "utf8");
    writeFileSync(join(testDir, "src", "service.ts"),
      `import { BASE } from "./base.js";\nexport function getBase() { return BASE; }\n`, "utf8");
    writeFileSync(join(testDir, "src", "controller.ts"),
      `import { getBase } from "./service.js";\nexport function handleRequest() { return getBase(); }\n`, "utf8");
    writeFileSync(join(testDir, "src", "route.ts"),
      `import { handleRequest } from "./controller.js";\nexport const route = handleRequest;\n`, "utf8");
    writeFileSync(join(testDir, "src", "unrelated.ts"),
      `export const UNRELATED = "unrelated";\n`, "utf8");
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: buildFromSummaries builds correct fileDependents mapping", () => {
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();
    const cache = resolver.getAstCache();
    const rdx = new ReverseDependencyIndex(cache);

    const summaries = resolver.getAllSummaries();
    const map = rdx.buildFromSummaries(summaries);

    // service.ts depends on base.ts
    expect(map.fileDependents["src/base.ts"]).toContain("src/service.ts");
    // controller.ts depends on service.ts
    expect(map.fileDependents["src/service.ts"]).toContain("src/controller.ts");
    // route.ts depends on controller.ts
    expect(map.fileDependents["src/controller.ts"]).toContain("src/route.ts");
    // unrelated.ts has no dependents
    expect(map.fileDependents["src/unrelated.ts"] ?? []).toEqual([]);
  });

  it("TEST 2: getTransitiveAffected returns full closure from changed file", () => {
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();
    const cache = resolver.getAstCache();
    const rdx = new ReverseDependencyIndex(cache);
    rdx.buildFromSummaries(resolver.getAllSummaries());

    // If base.ts changes, everything downstream should be affected
    const affected = rdx.getTransitiveAffected(["src/base.ts"]);
    expect(affected).not.toBeNull();
    expect(affected!).toContain("src/base.ts");
    expect(affected!).toContain("src/service.ts");
    expect(affected!).toContain("src/controller.ts");
    expect(affected!).toContain("src/route.ts");
    // But NOT unrelated.ts
    expect(affected!).not.toContain("src/unrelated.ts");
  });

  it("TEST 3: getTransitiveAffected from leaf only returns that file", () => {
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();
    const cache = resolver.getAstCache();
    const rdx = new ReverseDependencyIndex(cache);
    rdx.buildFromSummaries(resolver.getAllSummaries());

    // route.ts is a leaf (nothing imports it)
    const affected = rdx.getTransitiveAffected(["src/route.ts"]);
    expect(affected).not.toBeNull();
    expect(affected!).toContain("src/route.ts");
    expect(affected!).not.toContain("src/base.ts");
    expect(affected!).not.toContain("src/service.ts");
  });

  it("TEST 4: updateFile correctly removes old edges and adds new edges", () => {
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();
    const cache = resolver.getAstCache();
    const rdx = new ReverseDependencyIndex(cache);
    rdx.buildFromSummaries(resolver.getAllSummaries());

    // Simulate service.ts now importing from unrelated.ts instead of base.ts
    rdx.updateFile(
      "src/service.ts",
      ["src/base.ts"],      // old imports
      ["src/unrelated.ts"]  // new imports
    );

    const baseMap = rdx.getFileDependents("src/base.ts");
    const unrelatedMap = rdx.getFileDependents("src/unrelated.ts");

    expect(baseMap).not.toContain("src/service.ts");
    expect(unrelatedMap).toContain("src/service.ts");
  });

  it("TEST 5: removeFile clears all its entries from the index", () => {
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();
    const cache = resolver.getAstCache();
    const rdx = new ReverseDependencyIndex(cache);
    rdx.buildFromSummaries(resolver.getAllSummaries());

    rdx.removeFile("src/service.ts");

    // base.ts should no longer list service.ts as a dependent
    const baseMap = rdx.getFileDependents("src/base.ts");
    expect(baseMap).not.toContain("src/service.ts");

    // service.ts target entry should also be removed
    const serviceMap = rdx.getFileDependents("src/service.ts");
    expect(serviceMap).toEqual([]);
  });

  it("TEST 6: load() returns ok=false when no index has been persisted", () => {
    const resolver = new SymbolReferenceResolver(testDir);
    // Do NOT call parseProject, so no cache/index exists
    const cache = resolver.getAstCache();
    cache.init();

    const rdx = new ReverseDependencyIndex(cache);
    const result = rdx.load();

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBeTruthy();
  });

  it("TEST 7: persist() then load() returns consistent data", () => {
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();
    const cache = resolver.getAstCache();
    const rdx = new ReverseDependencyIndex(cache);
    rdx.buildFromSummaries(resolver.getAllSummaries());

    // Persist
    rdx.persist();

    // Load into new instance
    const rdx2 = new ReverseDependencyIndex(cache);
    const result = rdx2.load();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.map.fileDependents["src/base.ts"]).toContain("src/service.ts");
    }
  });

  it("TEST 8: computeHash is deterministic — same index, same hash", () => {
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();
    const cache = resolver.getAstCache();

    const rdx1 = new ReverseDependencyIndex(cache);
    rdx1.buildFromSummaries(resolver.getAllSummaries());

    const rdx2 = new ReverseDependencyIndex(cache);
    rdx2.buildFromSummaries(resolver.getAllSummaries());

    expect(rdx1.computeHash()).toBe(rdx2.computeHash());
    expect(rdx1.computeHash()).not.toBe("");
  });
});
