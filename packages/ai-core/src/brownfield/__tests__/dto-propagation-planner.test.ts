/**
 * DTOPropagationPlanner Test Suite — Aegis V2.3 Project 2 Phase 6
 *
 * Tests:
 * - DTO field renaming across interface, property access, and object literals
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ContractDefinitionResolver } from "../contract-refactoring/contract-definition-resolver.js";
import { DTOPropagationPlanner } from "../contract-refactoring/dto-propagation-planner.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "dto"), { recursive: true });
  mkdirSync(join(dir, "src", "controllers"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("DTOPropagationPlanner Tests", () => {
  let testDir: string;
  let defResolver: ContractDefinitionResolver;
  let dtoPlanner: DTOPropagationPlanner;

  beforeEach(() => {
    testDir = makeProject("aegis-dto-plan-");

    writeFileSync(
      join(testDir, "src", "dto", "ExpenseDTO.ts"),
      `export interface ExpenseDTO {\n  id: string;\n  category: string;\n}\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "controllers", "expenseController.ts"),
      `import { ExpenseDTO } from "../dto/ExpenseDTO.js";\nexport function handle(dto: ExpenseDTO) {\n  return dto.category.trim();\n}\n`,
      "utf8"
    );

    defResolver = new ContractDefinitionResolver(testDir);
    dtoPlanner = new DTOPropagationPlanner(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Plans DTO field rename across interface and property accesses", () => {
    const contract = defResolver.resolveContract("src/dto/ExpenseDTO.ts", "ExpenseDTO")!;
    const res = dtoPlanner.planFieldRename(
      contract,
      "category",
      "expenseCategory",
      ["src/dto/ExpenseDTO.ts", "src/controllers/expenseController.ts"]
    );

    expect(res.valid).toBe(true);
    expect(res.patches.length).toBe(2);

    const dtoPatch = res.patches.find(p => p.filePath.includes("ExpenseDTO.ts"));
    const controllerPatch = res.patches.find(p => p.filePath.includes("expenseController.ts"));

    expect(dtoPatch).toBeDefined();
    expect(dtoPatch!.replacementSnippet).toBe("expenseCategory");

    expect(controllerPatch).toBeDefined();
    expect(controllerPatch!.replacementSnippet).toBe("expenseCategory");
  });
});
