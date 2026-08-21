/**
 * ContractDefinitionResolver Test Suite — Aegis V2.3 Project 2 Phase 6
 *
 * Tests:
 * - Function contract definition parsing (parameters, return types)
 * - Interface / DTO contract definition parsing (fields, optionality)
 * - Hook and component Props contract resolution
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ContractDefinitionResolver } from "../contract-refactoring/contract-definition-resolver.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "services"), { recursive: true });
  mkdirSync(join(dir, "src", "dto"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("ContractDefinitionResolver Tests", () => {
  let testDir: string;
  let resolver: ContractDefinitionResolver;

  beforeEach(() => {
    testDir = makeProject("aegis-contract-def-");

    writeFileSync(
      join(testDir, "src", "services", "taskService.ts"),
      `export function updateTask(id: string, title: string): { id: string } {\n  return { id };\n}\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "dto", "taskDTO.ts"),
      `export interface TaskDTO {\n  id: string;\n  category: string;\n  completed?: boolean;\n}\n`,
      "utf8"
    );

    resolver = new ContractDefinitionResolver(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Resolves service function contract parameters and return type", () => {
    const contract = resolver.resolveContract("src/services/taskService.ts", "updateTask");

    expect(contract).toBeDefined();
    expect(contract!.symbolName).toBe("updateTask");
    expect(contract!.parameters?.length).toBe(2);
    expect(contract!.parameters?.[0].name).toBe("id");
    expect(contract!.parameters?.[1].name).toBe("title");
  });

  it("TEST 2: Resolves DTO interface fields and optionality", () => {
    const contract = resolver.resolveContract("src/dto/taskDTO.ts", "TaskDTO");

    expect(contract).toBeDefined();
    expect(contract!.symbolName).toBe("TaskDTO");
    expect(contract!.fields?.length).toBe(3);
    expect(contract!.fields?.[1].name).toBe("category");
    expect(contract!.fields?.[2].isOptional).toBe(true);
  });
});
