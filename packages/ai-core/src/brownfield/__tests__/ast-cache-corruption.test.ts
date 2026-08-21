/**
 * AST Cache Corruption & Recovery Test Suite — Aegis V2.3 Project 2 Phase 1
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PersistentAstCache } from "../ast-cache/persistent-ast-cache.js";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";

describe("Aegis V2.3 Project 2 Phase 1 — AST Cache Corruption & Recovery", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "aegis-ast-cache-corrupt-"));
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
      join(testDir, "src", "service.ts"),
      `export function executeQuery() { return "data"; }\n`,
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

  it("TEST 1: Malformed manifest JSON triggers clean reset and successful cold analysis", () => {
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();

    const cache = resolver.getAstCache();
    const manifestPath = join(cache.cacheDir, "manifest.json");

    // Corrupt manifest file with invalid JSON
    writeFileSync(manifestPath, "{ invalid json content ... truncated", "utf8");

    // Run new resolver pass
    const newResolver = new SymbolReferenceResolver(testDir);
    const summaries = newResolver.parseProject();

    expect(summaries.has("src/service.ts")).toBe(true);
    expect(summaries.get("src/service.ts")?.symbols[0].name).toBe("executeQuery");

    // Manifest should be recreated and valid
    const newManifest = newResolver.getAstCache().loadManifest();
    expect(newManifest).not.toBeNull();
    expect(newManifest?.version).toBe(1);
  });

  it("TEST 2: Corrupted file record safely falls back to single-file cold parsing", () => {
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();

    const cache = resolver.getAstCache();
    const fileRecordPath = join(cache.filesDir, "src__service.ts.json");
    expect(existsSync(fileRecordPath)).toBe(true);

    // Corrupt the record
    writeFileSync(fileRecordPath, "corrupted { file: true }", "utf8");

    // New resolver instance
    const newResolver = new SymbolReferenceResolver(testDir);
    const summaries = newResolver.parseProject();

    expect(summaries.has("src/service.ts")).toBe(true);
    expect(summaries.get("src/service.ts")?.symbols[0].name).toBe("executeQuery");
  });

  it("TEST 3: Modified tsconfig.json triggers FULL_INVALIDATION", () => {
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();

    const oldManifest = resolver.getAstCache().loadManifest();

    // Modify tsconfig.json
    writeFileSync(
      join(testDir, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { target: "ESNext", baseUrl: "./src" } }, null, 2),
      "utf8"
    );

    const newResolver = new SymbolReferenceResolver(testDir);
    newResolver.parseProject();

    const newManifest = newResolver.getAstCache().loadManifest();
    expect(newManifest?.tsconfigHash).not.toBe(oldManifest?.tsconfigHash);
  });

  it("TEST 4: Incompatible cache schema version triggers FULL_INVALIDATION", () => {
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();

    const cache = resolver.getAstCache();
    const manifestPath = join(cache.cacheDir, "manifest.json");
    const manifest = cache.loadManifest()!;
    manifest.version = 999; // Incompatible future version
    writeFileSync(manifestPath, JSON.stringify(manifest), "utf8");

    const newResolver = new SymbolReferenceResolver(testDir);
    newResolver.parseProject();

    const resetManifest = newResolver.getAstCache().loadManifest();
    expect(resetManifest?.version).toBe(1);
  });
});
