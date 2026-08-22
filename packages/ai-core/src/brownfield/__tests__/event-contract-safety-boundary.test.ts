/**
 * Event Contract Safety Boundary Test Suite — Aegis V2.3 Project 2 Phase 7.3
 *
 * Negative & Safety boundary test matrix:
 * 1. Missing event contract → EVENT_CONTRACT_INCOMPLETE, ZERO file mutation
 * 2. Stale preview preimage drift → PLAN_STALE, ZERO file mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { EventContractExecutor } from "../runtime-contract/events/event-contract-executor.js";
import { EventContractPreviewEngine } from "../runtime-contract/events/event-contract-preview.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "events"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("Event Contract Safety Boundary Tests", () => {
  let testDir: string;
  let executor: EventContractExecutor;

  beforeEach(() => {
    testDir = makeProject("aegis-event-safety-");
    executor = new EventContractExecutor(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Non-existent event produces EVENT_CONTRACT_INCOMPLETE and zero file mutation", async () => {
    writeFileSync(join(testDir, "src", "events", "code.ts"), `export const x = 1;\n`, "utf8");
    const before = readFileSync(join(testDir, "src", "events", "code.ts"), "utf8");

    const result = await executor.execute({
      projectPath: testDir,
      operation: "EVENT_NAME_RENAME",
      sourceFile: "src/events/code.ts",
      eventName: "missing.event",
      newEventName: "new.event",
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("EVENT_CONTRACT_INCOMPLETE");
    expect(readFileSync(join(testDir, "src", "events", "code.ts"), "utf8")).toBe(before);
  });

  it("TEST 2: Stale preview preimage drift produces PLAN_STALE and zero file mutation", async () => {
    writeFileSync(
      join(testDir, "src", "events", "taskEvents.ts"),
      `import { EventEmitter } from "events";\nexport const bus = new EventEmitter();\nbus.emit("task.updated", { priority: "HIGH" });\n`,
      "utf8"
    );

    const preview = EventContractPreviewEngine.generatePreview({
      projectPath: testDir,
      operation: "EVENT_NAME_RENAME",
      sourceFile: "src/events/taskEvents.ts",
      eventName: "task.updated",
      newEventName: "task.modified",
    });

    // Mutate file behind preview's back
    writeFileSync(join(testDir, "src", "events", "taskEvents.ts"), `/* drift */\n`, "utf8");
    const beforeExec = readFileSync(join(testDir, "src", "events", "taskEvents.ts"), "utf8");

    const result = await executor.execute({
      projectPath: testDir,
      operation: "EVENT_NAME_RENAME",
      sourceFile: "src/events/taskEvents.ts",
      eventName: "task.updated",
      newEventName: "task.modified",
      preview,
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("PLAN_STALE");
    expect(readFileSync(join(testDir, "src", "events", "taskEvents.ts"), "utf8")).toBe(beforeExec);
  });
});
