/**
 * HttpControllerResolver Test Suite — Aegis V2.3 Project 2 Phase 7.2
 *
 * Tests:
 * - Controller method inspection: req.params, req.query, req.body
 * - Response status codes and service invocations
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { HttpControllerResolver } from "../runtime-contract/http/http-controller-resolver.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "controllers"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("HttpControllerResolver Tests", () => {
  let testDir: string;
  let resolver: HttpControllerResolver;

  beforeEach(() => {
    testDir = makeProject("aegis-http-ctrl-");

    writeFileSync(
      join(testDir, "src", "controllers", "taskController.ts"),
      `export const taskController = {\n  create: async (req: any, res: any) => {\n    const data = req.body;\n    const result = await taskService.createTask(data);\n    return res.status(201).json(result);\n  },\n  getById: async (req: any, res: any) => {\n    const id = req.params.id;\n    const result = await taskService.getTask(id);\n    return res.status(200).json(result);\n  }\n};\n`,
      "utf8"
    );

    resolver = new HttpControllerResolver(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Resolves controller method body usage and status code 201", () => {
    const info = resolver.resolveControllerMethod("src/controllers/taskController.ts", "taskController", "create");

    expect(info).toBeDefined();
    expect(info!.usesBody).toBe(true);
    expect(info!.statusCodes).toContain(201);
  });

  it("TEST 2: Resolves req.params.id extraction on getById", () => {
    const info = resolver.resolveControllerMethod("src/controllers/taskController.ts", "taskController", "getById");

    expect(info).toBeDefined();
    expect(info!.extractedParams).toContain("id");
    expect(info!.statusCodes).toContain(200);
  });
});
