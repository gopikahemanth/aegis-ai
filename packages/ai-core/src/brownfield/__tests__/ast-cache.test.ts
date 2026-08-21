/**
 * AST Cache Basic Persistence & Storage Test Suite — Aegis V2.3 Project 2 Phase 1
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PersistentAstCache } from "../ast-cache/persistent-ast-cache.js";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";
import { AST_CACHE_SCHEMA_VERSION, AST_CACHE_COMPATIBILITY_KEY } from "../ast-cache/ast-cache-contract.js";

describe("Aegis V2.3 Project 2 Phase 1 — AST Cache Basic Persistence & Storage", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "aegis-ast-cache-test-"));
    mkdirSync(join(testDir, "src"), { recursive: true });

    writeFileSync(
      join(testDir, "package.json"),
      JSON.stringify({ name: "mock-app", version: "1.0.0" }, null, 2),
      "utf8"
    );

    writeFileSync(
      join(testDir, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { target: "ES2022", module: "NodeNext" } }, null, 2),
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "math.ts"),
      `export function add(a: number, b: number): number { return a + b; }\nexport const PI = 3.14159;\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "index.ts"),
      `import { add, PI } from "./math.js";\nexport function calculate(x: number) { return add(x, PI); }\n`,
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

  it("TEST 1: Cold scan creates versioned manifest and persistent directory structure", () => {
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();

    const cache = resolver.getAstCache();
    expect(existsSync(cache.cacheDir)).toBe(true);
    expect(existsSync(join(cache.cacheDir, "manifest.json"))).toBe(true);

    const manifest = cache.loadManifest();
    expect(manifest).not.toBeNull();
    expect(manifest?.version).toBe(AST_CACHE_SCHEMA_VERSION);
    expect(manifest?.compatibilityKey).toBe(AST_CACHE_COMPATIBILITY_KEY);
    expect(manifest?.aegisVersion).toBe("2.3.0");
    expect(manifest?.tsconfigHash).toBeTruthy();
    expect(manifest?.packageJsonHash).toBeTruthy();
  });

  it("TEST 2: Automatically ensures .aegis/cache/ is in .gitignore", () => {
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();

    const gitignorePath = join(testDir, ".gitignore");
    expect(existsSync(gitignorePath)).toBe(true);
    const content = readFileSync(gitignorePath, "utf8");
    expect(content).toContain(".aegis/cache/");
  });

  it("TEST 3: Persists individual file records with extracted symbols and imports", () => {
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();

    const cache = resolver.getAstCache();
    const mathRecord = cache.getFileRecord("src/math.ts");
    expect(mathRecord).not.toBeNull();
    expect(mathRecord?.filePath).toBe("src/math.ts");
    expect(mathRecord?.symbols.some(s => s.name === "add")).toBe(true);
    expect(mathRecord?.symbols.some(s => s.name === "PI")).toBe(true);

    const indexRecord = cache.getFileRecord("src/index.ts");
    expect(indexRecord).not.toBeNull();
    expect(indexRecord?.imports.some(i => i.sourceModuleSpecifier === "./math.js")).toBe(true);
  });

  it("TEST 4: Persists global symbol table index", () => {
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();

    const cache = resolver.getAstCache();
    const symbolTable = cache.loadSymbolTable();
    expect(symbolTable).not.toBeNull();
    expect(Array.isArray(symbolTable)).toBe(true);
    expect(symbolTable?.some(s => s.symbolName === "add" && s.filePath === "src/math.ts")).toBe(true);
    expect(symbolTable?.some(s => s.symbolName === "calculate" && s.filePath === "src/index.ts")).toBe(true);
  });

  it("TEST 5: Persists reverse dependency index", () => {
    const resolver = new SymbolReferenceResolver(testDir);
    resolver.parseProject();

    const cache = resolver.getAstCache();
    const reverseDeps = cache.loadReverseDependencies();
    expect(reverseDeps).not.toBeNull();
    expect(reverseDeps?.fileDependents["src/math.ts"]).toContain("src/index.ts");
  });
});
