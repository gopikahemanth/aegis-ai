/**
 * WebSocketContractResolver Test Suite — Aegis V2.3 Project 2 Phase 7.3
 *
 * Tests:
 * - WebSocket send discovery with JSON discriminator
 * - WebSocket on("message") message handler
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { WebSocketContractResolver } from "../runtime-contract/events/websocket-contract-resolver.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "ws"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("WebSocketContractResolver Tests", () => {
  let testDir: string;
  let resolver: WebSocketContractResolver;

  beforeEach(() => {
    testDir = makeProject("aegis-ws-");

    writeFileSync(
      join(testDir, "src", "ws", "handler.ts"),
      `export function handle(ws: any) {\n  ws.send(JSON.stringify({ type: "task.updated", payload: { id: "1" } }));\n  ws.on("message", (data: any) => {\n    const msg = JSON.parse(data);\n    if (msg.type === "task.updated") {\n      console.log(msg);\n    }\n  });\n}\n`,
      "utf8"
    );

    resolver = new WebSocketContractResolver(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Discovers WebSocket send with JSON discriminator and message consumer", () => {
    const res = resolver.discover();

    expect(res.producers.length).toBe(1);
    expect(res.producers[0].eventName).toBe("task.updated");

    expect(res.consumers.length).toBe(1);
    expect(res.consumers[0].eventName).toBe("task.updated");
  });
});
