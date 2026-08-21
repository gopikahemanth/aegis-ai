/**
 * HttpContractPatchPlanner Test Suite — Aegis V2.3 Project 2 Phase 7.2
 *
 * Tests:
 * - Simultaneous patch generation for server route and client caller
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { HttpRouteResolver } from "../runtime-contract/http/http-route-resolver.js";
import { HttpClientResolver } from "../runtime-contract/http/http-client-resolver.js";
import { HttpContractPatchPlanner } from "../runtime-contract/http/http-contract-patch-planner.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "routes"), { recursive: true });
  mkdirSync(join(dir, "src", "api"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("HttpContractPatchPlanner Tests", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = makeProject("aegis-http-patch-");

    writeFileSync(
      join(testDir, "src", "routes", "expenseRoutes.ts"),
      `import { Router } from "express";\nexport const router = Router();\nrouter.get("/api/expenses", handler);\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "api", "expenseClient.ts"),
      `export async function getExpenses() {\n  return fetch("/api/expenses");\n}\n`,
      "utf8"
    );
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Plans simultaneous route rename across server route and client fetch call", () => {
    const routeResolver = new HttpRouteResolver(testDir);
    const clientResolver = new HttpClientResolver(testDir);
    const patchPlanner = new HttpContractPatchPlanner(testDir);

    const routes = routeResolver.discoverRoutes();
    const clients = clientResolver.discoverClientCalls();
    const endpoint = routes[0];

    const pRes = patchPlanner.planRouteRename(endpoint, clients, "/api/expense-records");

    expect(pRes.valid).toBe(true);
    expect(pRes.patches.length).toBe(2);
    expect(pRes.affectedFiles).toContain("src/routes/expenseRoutes.ts");
    expect(pRes.affectedFiles).toContain("src/api/expenseClient.ts");
  });
});
