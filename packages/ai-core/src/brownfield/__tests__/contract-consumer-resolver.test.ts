/**
 * ContractConsumerResolver Test Suite — Aegis V2.3 Project 2 Phase 6
 *
 * Tests:
 * - Consumer discovery across controllers, hooks, and tests
 * - Consumer classification (MUST_CHANGE, PROTECTED)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ContractDefinitionResolver } from "../contract-refactoring/contract-definition-resolver.js";
import { ContractConsumerResolver } from "../contract-refactoring/contract-consumer-resolver.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "services"), { recursive: true });
  mkdirSync(join(dir, "src", "controllers"), { recursive: true });
  mkdirSync(join(dir, "src", "__tests__"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("ContractConsumerResolver Tests", () => {
  let testDir: string;
  let defResolver: ContractDefinitionResolver;
  let consumerResolver: ContractConsumerResolver;

  beforeEach(() => {
    testDir = makeProject("aegis-consumer-res-");

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

    writeFileSync(
      join(testDir, "src", "__tests__", "taskService.test.ts"),
      `import { updateTask } from "../services/taskService.js";\nexport const testRun = updateTask("1", "T");\n`,
      "utf8"
    );

    defResolver = new ContractDefinitionResolver(testDir);
    consumerResolver = new ContractConsumerResolver(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Discovers callers and classifies controller as MUST_CHANGE and test as PROTECTED", () => {
    const contract = defResolver.resolveContract("src/services/taskService.ts", "updateTask")!;
    const res = consumerResolver.discoverConsumers(contract);

    expect(res.consumers.length).toBe(2);
    const controllerConsumer = res.consumers.find(c => c.filePath.includes("taskController.ts"));
    const testConsumer = res.consumers.find(c => c.filePath.includes("taskService.test.ts"));

    expect(controllerConsumer).toBeDefined();
    expect(controllerConsumer!.classification).toBe("MUST_CHANGE");

    expect(testConsumer).toBeDefined();
    expect(testConsumer!.classification).toBe("PROTECTED");
  });
});
