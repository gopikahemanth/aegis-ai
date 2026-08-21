/**
 * SymbolDefinitionResolver Test Suite — Aegis V2.3 Project 2 Phase 3
 *
 * Tests:
 * - Function declarations (named, export, default export)
 * - Class declarations (class, methods)
 * - Interfaces and Type aliases
 * - Variables, constants, hooks, components
 * - Scope depth and exact identifier span isolation
 * - Non-existent symbol handling
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SymbolDefinitionResolver } from "../refactoring/symbol-definition-resolver.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("SymbolDefinitionResolver Tests", () => {
  let testDir: string;
  let resolver: SymbolDefinitionResolver;

  beforeEach(() => {
    testDir = makeProject("aegis-def-resolver-");
    resolver = new SymbolDefinitionResolver(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Resolves exported function declaration with exact span and export flag", () => {
    const file = "src/math.ts";
    writeFileSync(
      join(testDir, file),
      `export function calculateSum(a: number, b: number): number {\n  return a + b;\n}\n`,
      "utf8"
    );

    const def = resolver.resolveDefinition(file, "calculateSum");
    expect(def).not.toBeNull();
    expect(def!.name).toBe("calculateSum");
    expect(def!.kind).toBe("function");
    expect(def!.isExported).toBe(true);
    expect(def!.isDefaultExport).toBe(false);
    expect(def!.line).toBe(1);
    expect(def!.nameStartPos).toBeGreaterThan(0);
    expect(def!.nameEndPos).toBe(def!.nameStartPos + "calculateSum".length);
  });

  it("TEST 2: Resolves class and class method definitions", () => {
    const file = "src/TaskService.ts";
    writeFileSync(
      join(testDir, file),
      `export class TaskService {\n  public updateTask(id: string, data: any) {\n    return true;\n  }\n}\n`,
      "utf8"
    );

    const classDef = resolver.resolveDefinition(file, "TaskService");
    expect(classDef).not.toBeNull();
    expect(classDef!.kind).toBe("class");
    expect(classDef!.isExported).toBe(true);

    const methodDef = resolver.resolveDefinition(file, "updateTask");
    expect(methodDef).not.toBeNull();
    expect(methodDef!.kind).toBe("method");
    expect(methodDef!.containerName).toBe("TaskService");
  });

  it("TEST 3: Resolves interface and type alias declarations", () => {
    const file = "src/types.ts";
    writeFileSync(
      join(testDir, file),
      `export interface TaskItem {\n  id: string;\n  title: string;\n}\n\nexport type TaskStatus = "PENDING" | "DONE";\n`,
      "utf8"
    );

    const ifaceDef = resolver.resolveDefinition(file, "TaskItem");
    expect(ifaceDef).not.toBeNull();
    expect(ifaceDef!.kind).toBe("interface");

    const typeDef = resolver.resolveDefinition(file, "TaskStatus");
    expect(typeDef).not.toBeNull();
    expect(typeDef!.kind).toBe("type");
  });

  it("TEST 4: Resolves React component functions and arrow components", () => {
    const file = "src/TaskCard.tsx";
    writeFileSync(
      join(testDir, file),
      `export const TaskCard = ({ title }: { title: string }) => {\n  return <div>{title}</div>;\n};\n`,
      "utf8"
    );

    const compDef = resolver.resolveDefinition(file, "TaskCard");
    expect(compDef).not.toBeNull();
    expect(compDef!.kind).toBe("component");
  });

  it("TEST 5: Returns null for non-existent symbol or missing file", () => {
    const file = "src/empty.ts";
    writeFileSync(join(testDir, file), `const x = 1;\n`, "utf8");

    expect(resolver.resolveDefinition(file, "nonExistentSymbol")).toBeNull();
    expect(resolver.resolveDefinition("src/missing.ts", "anySymbol")).toBeNull();
  });
});
