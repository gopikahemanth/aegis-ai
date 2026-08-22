/**
 * SocketIOContractResolver Test Suite — Aegis V2.3 Project 2 Phase 7.3
 *
 * Tests:
 * - Socket.IO emit / on discovery
 * - Room and ACK detection
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SocketIOContractResolver } from "../runtime-contract/events/socketio-contract-resolver.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "sockets"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("SocketIOContractResolver Tests", () => {
  let testDir: string;
  let resolver: SocketIOContractResolver;

  beforeEach(() => {
    testDir = makeProject("aegis-socketio-");

    writeFileSync(
      join(testDir, "src", "sockets", "taskSocket.ts"),
      `export function setup(io: any, socket: any) {\n  io.to("tasks").emit("task.created", { id: "1" });\n  socket.on("task.created", (data: any, ack: any) => {\n    console.log(data.id);\n    ack();\n  });\n}\n`,
      "utf8"
    );

    resolver = new SocketIOContractResolver(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Discovers Socket.IO room emit and ACK consumer handler", () => {
    const res = resolver.discover();

    expect(res.producers.length).toBe(1);
    expect(res.producers[0].eventName).toBe("task.created");
    expect(res.producers[0].room).toBe("tasks");

    expect(res.consumers.length).toBe(1);
    expect(res.consumers[0].eventName).toBe("task.created");
    expect(res.consumers[0].hasAck).toBe(true);
  });
});
