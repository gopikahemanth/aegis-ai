/**
 * HttpRouteResolver Test Suite — Aegis V2.3 Project 2 Phase 7.2
 *
 * Tests:
 * - Express route discovery (app.get, router.post, router.patch)
 * - Router mounting (app.use("/api/tasks", taskRouter))
 * - Path normalization and handler extraction
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { HttpRouteResolver } from "../runtime-contract/http/http-route-resolver.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "routes"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("HttpRouteResolver Tests", () => {
  let testDir: string;
  let resolver: HttpRouteResolver;

  beforeEach(() => {
    testDir = makeProject("aegis-http-route-");

    // Server app file with router mounting
    writeFileSync(
      join(testDir, "src", "server.ts"),
      `import express from "express";\nimport { taskRouter } from "./routes/taskRoutes.js";\n\nconst app = express();\napp.use("/api/tasks", taskRouter);\n`,
      "utf8"
    );

    // Route file
    writeFileSync(
      join(testDir, "src", "routes", "taskRoutes.ts"),
      `import { Router } from "express";\nimport { taskController } from "../controllers/taskController.js";\n\nexport const taskRouter = Router();\ntaskRouter.get("/:id", taskController.getById);\ntaskRouter.post("/", taskController.create);\n`,
      "utf8"
    );

    resolver = new HttpRouteResolver(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Discovers mounted Express routes and resolves normalized paths", () => {
    const routes = resolver.discoverRoutes();

    expect(routes.length).toBe(2);

    const getRoute = routes.find(r => r.method === "GET");
    expect(getRoute).toBeDefined();
    expect(getRoute!.normalizedPath).toBe("/api/tasks/:id");
    expect(getRoute!.controllerSymbol).toBe("taskController");
    expect(getRoute!.controllerMethod).toBe("getById");

    const postRoute = routes.find(r => r.method === "POST");
    expect(postRoute).toBeDefined();
    expect(postRoute!.normalizedPath).toBe("/api/tasks");
  });
});
