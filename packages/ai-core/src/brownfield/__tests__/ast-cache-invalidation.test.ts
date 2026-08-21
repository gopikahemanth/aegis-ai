/**
 * AST Cache Invalidation Test Suite — Aegis V2.3 Project 2 Phase 1
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, utimesSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";
import { AstCacheValidator } from "../ast-cache/ast-cache-validator.js";

describe("Aegis V2.3 Project 2 Phase 1 — AST Cache Invalidation & Hybrid Validation", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "aegis-ast-cache-inval-"));
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
      join(testDir, "src", "user.ts"),
      `export interface User { id: string; name: string; }\nexport function getUser() { return null; }\n`,
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

  it("TEST 1: Hybrid Fast-Path — CACHE_HIT when mtime and size are identical", () => {
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();

    const cache = resolver.getAstCache();
    const cached = cache.getFileRecord("src/user.ts");
    expect(cached).not.toBeNull();

    const fullPath = join(testDir, "src", "user.ts");
    const check = AstCacheValidator.validateFileRecord(fullPath, cached);
    expect(check.status).toBe("CACHE_HIT");
  });

  it("TEST 2: Content Revalidation — CACHE_HIT_REVALIDATED when mtime changed but content identical", () => {
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();

    const cache = resolver.getAstCache();
    const cached = cache.getFileRecord("src/user.ts");
    expect(cached).not.toBeNull();

    const fullPath = join(testDir, "src", "user.ts");

    // Touch the file to change mtime without altering content
    const futureTime = (Date.now() + 50000) / 1000;
    utimesSync(fullPath, futureTime, futureTime);

    const check = AstCacheValidator.validateFileRecord(fullPath, cached);
    expect(check.status).toBe("CACHE_HIT_REVALIDATED");
  });

  it("TEST 3: Modified Content — CACHE_MISS_MODIFIED and parses updated symbols", () => {
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();

    // Modify file content
    writeFileSync(
      join(testDir, "src", "user.ts"),
      `export interface User { id: string; name: string; email: string; }\nexport function getUserEmail() { return "a@b.com"; }\n`,
      "utf8"
    );

    const newResolver = new SymbolReferenceResolver(testDir);
    const summaries = newResolver.parseProject();

    const userSummary = summaries.get("src/user.ts");
    expect(userSummary?.symbols.some(s => s.name === "getUserEmail")).toBe(true);
    expect(userSummary?.symbols.some(s => s.name === "getUser")).toBe(false);
  });
});
