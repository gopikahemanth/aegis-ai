/**
 * EventConsumerResolver Test Suite — Aegis V2.3 Project 2 Phase 7.3
 *
 * Tests:
 * - Aggregating event contracts across EventEmitter, Socket.IO, and WebSocket
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { EventConsumerResolver } from "../runtime-contract/events/event-consumer-resolver.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "events"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("EventConsumerResolver Tests", () => {
  let testDir: string;
  let resolver: EventConsumerResolver;

  beforeEach(() => {
    testDir = makeProject("aegis-event-agg-");

    writeFileSync(
      join(testDir, "src", "events", "bus.ts"),
      `import { EventEmitter } from "events";\nexport const eventBus = new EventEmitter();\neventBus.emit("user.login", { userId: "123" });\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "events", "listener.ts"),
      `import { eventBus } from "./bus.js";\neventBus.on("user.login", (data: any) => console.log(data));\n`,
      "utf8"
    );

    resolver = new EventConsumerResolver(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Aggregates unified EventContractNode with producers and consumers", () => {
    const contracts = resolver.discoverAllContracts();

    expect(contracts.length).toBe(1);
    expect(contracts[0].eventName).toBe("user.login");
    expect(contracts[0].producers.length).toBe(1);
    expect(contracts[0].consumers.length).toBe(1);
  });
});
