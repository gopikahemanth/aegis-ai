/**
 * HttpClientResolver Test Suite — Aegis V2.3 Project 2 Phase 7.2
 *
 * Tests:
 * - Client fetch calls and api.* wrappers
 * - Path interpolation canonicalization
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { HttpClientResolver } from "../runtime-contract/http/http-client-resolver.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "api"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("HttpClientResolver Tests", () => {
  let testDir: string;
  let resolver: HttpClientResolver;

  beforeEach(() => {
    testDir = makeProject("aegis-http-client-");

    writeFileSync(
      join(testDir, "src", "api", "taskClient.ts"),
      `export async function getTasks() {\n  return fetch("/api/tasks");\n}\n\nexport async function getTask(id: string) {\n  return fetch(\`/api/tasks/\${id}\`);\n}\n\nexport async function createTask(body: any) {\n  return fetch("/api/tasks", { method: "POST", body: JSON.stringify(body) });\n}\n`,
      "utf8"
    );

    resolver = new HttpClientResolver(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Discovers client fetch endpoints and canonicalizes path interpolations", () => {
    const clients = resolver.discoverClientCalls();

    expect(clients.length).toBe(3);

    const getTask = clients.find(c => c.rawUrl.includes("${id}"));
    expect(getTask).toBeDefined();
    expect(getTask!.normalizedPath).toBe("/api/tasks/:id");

    const postTask = clients.find(c => c.method === "POST");
    expect(postTask).toBeDefined();
    expect(postTask!.normalizedPath).toBe("/api/tasks");
  });
});
