/**
 * AST Cache Safety Boundary & Fallback Test Suite — Aegis V2.3 Project 2 Phase 1
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";
import { AstCacheLock } from "../ast-cache/ast-cache-lock.js";
import { PersistentAstCache } from "../ast-cache/persistent-ast-cache.js";

describe("Aegis V2.3 Project 2 Phase 1 — AST Cache Safety Boundary & Fallback", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "aegis-ast-cache-safety-"));
    mkdirSync(join(testDir, "src"), { recursive: true });

    writeFileSync(
      join(testDir, "package.json"),
      JSON.stringify({ name: "mock-app", version: "1.0.0" }, null, 2),
      "utf8"
    );

    writeFileSync(
      join(testDir, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { target: "ES2022" } }, null, 2),
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "app.ts"),
      `export const APP_NAME = "AegisApp";\nexport function start() { return true; }\n`,
      "utf8"
    );
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try {
        rmSync(testDir, { recursive: true, force: true });
      } catch {}
    }
  });

  it("TEST 1: Cache deletion yields exact same analysis as cold repository", () => {
    // 1. Initial run
    const resolver1 = new SymbolReferenceResolver(testDir);
    const initialSummaries = resolver1.parseProject();

    const cacheDir = join(testDir, ".aegis", "cache");
    expect(existsSync(cacheDir)).toBe(true);

    // 2. Delete entire .aegis/cache directory
    rmSync(cacheDir, { recursive: true, force: true });
    expect(existsSync(cacheDir)).toBe(false);

    // 3. New run on clean state
    const resolver2 = new SymbolReferenceResolver(testDir);
    const postDeletionSummaries = resolver2.parseProject();

    expect(Array.from(postDeletionSummaries.keys())).toEqual(Array.from(initialSummaries.keys()));
    expect(postDeletionSummaries.get("src/app.ts")?.symbols.map(s => s.name)).toEqual(
      initialSummaries.get("src/app.ts")?.symbols.map(s => s.name)
    );
  });

  it("TEST 2: Locked cache falls back to in-memory processing without throwing", () => {
    const cache = new PersistentAstCache(testDir);
    cache.init();

    // Acquire lock externally to simulate concurrent process
    const externalLock = new AstCacheLock(cache.cacheDir, 100);
    expect(externalLock.acquire()).toBe(true);

    // Run resolver while locked
    const resolver = new SymbolReferenceResolver(testDir);
    const summaries = resolver.parseProject();

    expect(summaries.has("src/app.ts")).toBe(true);
    expect(summaries.get("src/app.ts")?.symbols[0].name).toBe("APP_NAME");

    externalLock.release();
  });

  it("TEST 3: Security Guard — rejects attempts to cache .env or secret data", () => {
    const cache = new PersistentAstCache(testDir);
    cache.init();

    expect(() => {
      cache.setFileRecord({
        filePath: ".env",
        contentHash: "abc",
        mtimeMs: 100,
        sizeBytes: 10,
        symbols: [],
        imports: [],
        exports: [],
        unresolvedDynamicImports: [],
        callGraphEdges: [],
      });
    }).not.toThrow(); // Should safely catch and ignore without corrupting cache

    expect(cache.getFileRecord(".env")).toBeNull();
  });
});
