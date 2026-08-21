/**
 * HTTP Contract Safety Boundary Test Suite — Aegis V2.3 Project 2 Phase 7.2
 *
 * Negative & Safety boundary test matrix:
 * 1. Missing HTTP route → HTTP_ENDPOINT_UNRESOLVED, ZERO file mutation
 * 2. Stale preview preimage drift → PLAN_STALE, ZERO file mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { HttpContractExecutor } from "../runtime-contract/http/http-contract-executor.js";
import { HttpContractPreviewEngine } from "../runtime-contract/http/http-contract-preview.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "routes"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("HTTP Contract Safety Boundary Tests", () => {
  let testDir: string;
  let executor: HttpContractExecutor;

  beforeEach(() => {
    testDir = makeProject("aegis-http-safety-");
    executor = new HttpContractExecutor(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Non-existent route produces HTTP_ENDPOINT_UNRESOLVED and zero file mutation", async () => {
    writeFileSync(join(testDir, "src", "routes", "code.ts"), `export const x = 1;\n`, "utf8");
    const before = readFileSync(join(testDir, "src", "routes", "code.ts"), "utf8");

    const result = await executor.execute({
      projectPath: testDir,
      operation: "HTTP_ROUTE_RENAME",
      sourceFile: "src/routes/code.ts",
      endpointMethod: "GET",
      endpointPath: "/api/missing",
      newPath: "/api/new-missing",
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("HTTP_ENDPOINT_UNRESOLVED");
    expect(readFileSync(join(testDir, "src", "routes", "code.ts"), "utf8")).toBe(before);
  });

  it("TEST 2: Stale preview preimage drift produces PLAN_STALE and zero file mutation", async () => {
    writeFileSync(
      join(testDir, "src", "routes", "taskRoutes.ts"),
      `import { Router } from "express";\nexport const router = Router();\nrouter.get("/api/tasks", handler);\n`,
      "utf8"
    );

    const preview = HttpContractPreviewEngine.generatePreview({
      projectPath: testDir,
      operation: "HTTP_ROUTE_RENAME",
      sourceFile: "src/routes/taskRoutes.ts",
      endpointMethod: "GET",
      endpointPath: "/api/tasks",
      newPath: "/api/v2/tasks",
    });

    // Mutate file behind preview's back
    writeFileSync(join(testDir, "src", "routes", "taskRoutes.ts"), `/* drift */\n`, "utf8");
    const beforeExec = readFileSync(join(testDir, "src", "routes", "taskRoutes.ts"), "utf8");

    const result = await executor.execute({
      projectPath: testDir,
      operation: "HTTP_ROUTE_RENAME",
      sourceFile: "src/routes/taskRoutes.ts",
      endpointMethod: "GET",
      endpointPath: "/api/tasks",
      newPath: "/api/v2/tasks",
      preview,
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("PLAN_STALE");
    expect(readFileSync(join(testDir, "src", "routes", "taskRoutes.ts"), "utf8")).toBe(beforeExec);
  });
});
