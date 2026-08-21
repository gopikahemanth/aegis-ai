/**
 * ServiceContractPlanner Test Suite — Aegis V2.3 Project 2 Phase 6
 *
 * Tests:
 * - Service method parameter addition
 * - Controller and route call site propagation
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ContractDefinitionResolver } from "../contract-refactoring/contract-definition-resolver.js";
import { ServiceContractPlanner } from "../contract-refactoring/service-contract-planner.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "services"), { recursive: true });
  mkdirSync(join(dir, "src", "controllers"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("ServiceContractPlanner Tests", () => {
  let testDir: string;
  let defResolver: ContractDefinitionResolver;
  let servicePlanner: ServiceContractPlanner;

  beforeEach(() => {
    testDir = makeProject("aegis-srv-plan-");

    writeFileSync(
      join(testDir, "src", "services", "taskService.ts"),
      `export function updateTask(id: string, title: string) { return { id, title }; }\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "controllers", "taskController.ts"),
      `import { updateTask } from "../services/taskService.js";\nexport const run = updateTask("1", "T");\n`,
      "utf8"
    );

    defResolver = new ContractDefinitionResolver(testDir);
    servicePlanner = new ServiceContractPlanner(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Plans service parameter addition and propagates default argument to controller", () => {
    const contract = defResolver.resolveContract("src/services/taskService.ts", "updateTask")!;
    const res = servicePlanner.planParameterAddition(
      contract,
      { name: "priority", type: "string", defaultValue: '"NORMAL"' },
      ["src/services/taskService.ts", "src/controllers/taskController.ts"]
    );

    expect(res.valid).toBe(true);
    expect(res.patches.length).toBe(2);

    const srvPatch = res.patches.find(p => p.filePath.includes("taskService.ts"));
    const ctrlPatch = res.patches.find(p => p.filePath.includes("taskController.ts"));

    expect(srvPatch).toBeDefined();
    expect(srvPatch!.replacementSnippet).toContain('priority: string = "NORMAL"');

    expect(ctrlPatch).toBeDefined();
    expect(ctrlPatch!.replacementSnippet).toContain('"NORMAL"');
  });
});
