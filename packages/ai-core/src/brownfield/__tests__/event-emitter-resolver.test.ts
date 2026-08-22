/**
 * EventEmitterResolver Test Suite — Aegis V2.3 Project 2 Phase 7.3
 *
 * Tests:
 * - EventEmitter producer discovery (.emit)
 * - EventEmitter consumer discovery (.on / .addListener)
 * - Payload property access extraction
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { EventEmitterResolver } from "../runtime-contract/events/event-emitter-resolver.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "events"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("EventEmitterResolver Tests", () => {
  let testDir: string;
  let resolver: EventEmitterResolver;

  beforeEach(() => {
    testDir = makeProject("aegis-event-ee-");

    writeFileSync(
      join(testDir, "src", "events", "taskEvents.ts"),
      `import { EventEmitter } from "events";\n\nexport const taskEmitter = new EventEmitter();\n\nexport function notifyTaskUpdate(task: any) {\n  taskEmitter.emit("task.updated", task);\n}\n\ntaskEmitter.on("task.updated", (task: any) => {\n  console.log(task.priority);\n});\n`,
      "utf8"
    );

    resolver = new EventEmitterResolver(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Discovers EventEmitter producers and consumers and extracts accessed properties", () => {
    const res = resolver.discover();

    expect(res.producers.length).toBe(1);
    expect(res.producers[0].eventName).toBe("task.updated");
    expect(res.producers[0].transport).toBe("EVENT_EMITTER");

    expect(res.consumers.length).toBe(1);
    expect(res.consumers[0].eventName).toBe("task.updated");
    expect(res.consumers[0].accessedProperties).toContain("priority");
  });
});
