/**
 * TypeFieldRefactoring Test Suite — Aegis V2.3 Project 2 Phase 4
 *
 * Tests:
 * - Type/interface field addition
 * - Safe type/interface field removal
 * - Type field removal BLOCKED (BREAKING_CHANGE) when runtime property access exists
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SymbolDefinitionResolver } from "../refactoring/symbol-definition-resolver.js";
import { TypeFieldRefactoringPlanner } from "../refactoring/type-field-refactoring-planner.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("TypeFieldRefactoringPlanner Tests", () => {
  let testDir: string;
  let defResolver: SymbolDefinitionResolver;
  let planner: TypeFieldRefactoringPlanner;

  beforeEach(() => {
    testDir = makeProject("aegis-type-");
    defResolver = new SymbolDefinitionResolver(testDir);
    planner = new TypeFieldRefactoringPlanner(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Plans field addition to interface", () => {
    writeFileSync(
      join(testDir, "src", "types.ts"),
      `export interface Task {\n  id: string;\n  title: string;\n}\n`,
      "utf8"
    );

    const def = defResolver.resolveDefinition("src/types.ts", "Task")!;
    const res = planner.planFieldAddition(
      def,
      { name: "priority", type: "string", isOptional: true },
      ["src/types.ts"]
    );

    expect(res.valid).toBe(true);
    expect(res.definitionPatch).toBeDefined();
    expect(res.definitionPatch!.replacementSnippet).toContain("priority?: string;");
  });

  it("TEST 2: Type field removal is BLOCKED when runtime property access exists", () => {
    writeFileSync(
      join(testDir, "src", "types.ts"),
      `export interface Task {\n  id: string;\n  legacyCode: string;\n}\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "service.ts"),
      `import { Task } from "./types.js";\nexport function processTask(t: Task) {\n  return t.legacyCode.toUpperCase();\n}\n`,
      "utf8"
    );

    const def = defResolver.resolveDefinition("src/types.ts", "Task")!;
    const res = planner.planFieldRemoval(def, "legacyCode", ["src/types.ts", "src/service.ts"]);

    expect(res.valid).toBe(false);
    expect(res.blockedReason).toContain("BREAKING_CHANGE: Field \"legacyCode\" is actively accessed");
  });
});
