/**
 * ClientContractPlanner Test Suite — Aegis V2.3 Project 2 Phase 6
 *
 * Tests:
 * - API client function evolution
 * - Hook and component propagation
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ContractDefinitionResolver } from "../contract-refactoring/contract-definition-resolver.js";
import { ClientContractPlanner } from "../contract-refactoring/client-contract-planner.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "api"), { recursive: true });
  mkdirSync(join(dir, "src", "hooks"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("ClientContractPlanner Tests", () => {
  let testDir: string;
  let defResolver: ContractDefinitionResolver;
  let clientPlanner: ClientContractPlanner;

  beforeEach(() => {
    testDir = makeProject("aegis-cli-plan-");

    writeFileSync(
      join(testDir, "src", "api", "taskApi.ts"),
      `export function getTasks(status: string) { return []; }\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "hooks", "useTasks.ts"),
      `import { getTasks } from "../api/taskApi.js";\nexport function useTasks() { return getTasks("OPEN"); }\n`,
      "utf8"
    );

    defResolver = new ContractDefinitionResolver(testDir);
    clientPlanner = new ClientContractPlanner(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Plans API client evolution and propagates arguments to React hooks", () => {
    const contract = defResolver.resolveContract("src/api/taskApi.ts", "getTasks")!;
    const res = clientPlanner.planClientEvolution(
      contract,
      { name: "limit", type: "number", defaultValue: "10" },
      undefined,
      ["src/api/taskApi.ts", "src/hooks/useTasks.ts"]
    );

    expect(res.valid).toBe(true);
    expect(res.patches.length).toBe(2);

    const apiPatch = res.patches.find(p => p.filePath.includes("taskApi.ts"));
    const hookPatch = res.patches.find(p => p.filePath.includes("useTasks.ts"));

    expect(apiPatch).toBeDefined();
    expect(apiPatch!.replacementSnippet).toContain("limit: number = 10");

    expect(hookPatch).toBeDefined();
    expect(hookPatch!.replacementSnippet).toContain("10");
  });
});
