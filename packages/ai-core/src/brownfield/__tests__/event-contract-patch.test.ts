/**
 * EventContractPatchPlanner Test Suite — Aegis V2.3 Project 2 Phase 7.3
 *
 * Tests:
 * - Simultaneous patch generation for event name rename
 * - Simultaneous patch generation for event payload field rename in producers and consumers
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { EventConsumerResolver } from "../runtime-contract/events/event-consumer-resolver.js";
import { EventContractPatchPlanner } from "../runtime-contract/events/event-contract-patch-planner.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "events"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("EventContractPatchPlanner Tests", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = makeProject("aegis-event-patch-");

    writeFileSync(
      join(testDir, "src", "events", "producer.ts"),
      `import { emitter } from "./bus.js";\nexport function notify() {\n  emitter.emit("task.updated", { priority: "HIGH" });\n}\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "events", "consumer.ts"),
      `import { emitter } from "./bus.js";\nemitter.on("task.updated", (task: any) => {\n  console.log(task.priority);\n});\n`,
      "utf8"
    );
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Plans simultaneous event payload field rename in producer object and consumer property access", () => {
    const resolver = new EventConsumerResolver(testDir);
    const planner = new EventContractPatchPlanner(testDir);

    const contracts = resolver.discoverAllContracts();
    const contract = contracts.find(c => c.eventName === "task.updated")!;

    const pRes = planner.planPayloadFieldRename(contract, "priority", "taskPriority");

    expect(pRes.valid).toBe(true);
    expect(pRes.patches.length).toBe(2);
    expect(pRes.affectedFiles).toContain("src/events/producer.ts");
    expect(pRes.affectedFiles).toContain("src/events/consumer.ts");
  });
});
