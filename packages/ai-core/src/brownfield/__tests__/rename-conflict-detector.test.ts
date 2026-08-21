/**
 * RenameConflictDetector Test Suite — Aegis V2.3 Project 2 Phase 3
 *
 * Tests:
 * - Top-level symbol collision (function/class/variable with newName already exists)
 * - Class method collision within same class
 * - Dynamic import / require blocker
 * - Prisma schema model rename blocker
 * - Clean conflict-free rename scenario
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SymbolDefinitionResolver } from "../refactoring/symbol-definition-resolver.js";
import { RenameConflictDetector } from "../refactoring/rename-conflict-detector.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("RenameConflictDetector Tests", () => {
  let testDir: string;
  let defResolver: SymbolDefinitionResolver;
  let detector: RenameConflictDetector;

  beforeEach(() => {
    testDir = makeProject("aegis-conflict-");
    defResolver = new SymbolDefinitionResolver(testDir);
    detector = new RenameConflictDetector(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Detects collision when newName already exists in target file", () => {
    writeFileSync(
      join(testDir, "src", "helpers.ts"),
      `export function oldHelper() { return 1; }\nexport function newHelper() { return 2; }\n`,
      "utf8"
    );

    const def = defResolver.resolveDefinition("src/helpers.ts", "oldHelper")!;
    const result = detector.detectConflicts(def, "newHelper", ["src/helpers.ts"]);

    expect(result.hasConflicts).toBe(true);
    expect(result.status).toBe("SYMBOL_COLLISION");
    expect(result.conflicts.length).toBeGreaterThan(0);
    expect(result.conflicts[0]).toContain("already declared");
  });

  it("TEST 2: Detects method name collision within the same class", () => {
    writeFileSync(
      join(testDir, "src", "Service.ts"),
      `export class TaskService {\n  public updateTask() {}\n  public modifyTask() {}\n}\n`,
      "utf8"
    );

    const def = defResolver.resolveDefinition("src/Service.ts", "updateTask")!;
    const result = detector.detectConflicts(def, "modifyTask", ["src/Service.ts"]);

    expect(result.hasConflicts).toBe(true);
    expect(result.status).toBe("SYMBOL_COLLISION");
    expect(result.conflicts[0]).toContain("Method \"modifyTask\" already exists");
  });

  it("TEST 3: Blocks rename when dynamic import is detected", () => {
    writeFileSync(
      join(testDir, "src", "dynamic.ts"),
      `const mod = await import(\`./plugins/\${name}\`);\nexport function safeFunc() {}\n`,
      "utf8"
    );

    const def = defResolver.resolveDefinition("src/dynamic.ts", "safeFunc")!;
    const result = detector.detectConflicts(def, "renamedFunc", ["src/dynamic.ts"]);

    expect(result.hasConflicts).toBe(true);
    expect(result.status).toBe("DYNAMIC_DEPENDENCY_BLOCKED");
    expect(result.blockedReasons[0]).toContain("DYNAMIC_DEPENDENCY_BLOCKED");
  });

  it("TEST 4: Blocks Prisma model rename to prevent destructive migrations", () => {
    mkdirSync(join(testDir, "prisma"), { recursive: true });
    writeFileSync(
      join(testDir, "prisma", "schema.prisma"),
      `model Task {\n  id String @id\n}\n`,
      "utf8"
    );

    const dummyPrismaDef = {
      symbolId: "prisma/schema.prisma#Task@1:1",
      filePath: "prisma/schema.prisma",
      name: "Task",
      kind: "type" as const,
      isExported: true,
      isDefaultExport: false,
      startPos: 0,
      endPos: 20,
      nameStartPos: 6,
      nameEndPos: 10,
      line: 1,
      col: 7,
      scopeId: "global",
    };

    const result = detector.detectConflicts(dummyPrismaDef, "UserTask", ["prisma/schema.prisma"]);
    expect(result.hasConflicts).toBe(true);
    expect(result.status).toBe("PRISMA_MODEL_RENAME_BLOCKED");
  });

  it("TEST 5: Clean scenario returns READY with zero conflicts", () => {
    writeFileSync(
      join(testDir, "src", "clean.ts"),
      `export function originalFunc() { return true; }\n`,
      "utf8"
    );

    const def = defResolver.resolveDefinition("src/clean.ts", "originalFunc")!;
    const result = detector.detectConflicts(def, "freshNewFunc", ["src/clean.ts"]);

    expect(result.hasConflicts).toBe(false);
    expect(result.status).toBe("READY");
    expect(result.conflicts).toEqual([]);
    expect(result.blockedReasons).toEqual([]);
  });
});
