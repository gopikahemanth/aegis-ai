import { describe, it, expect } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";
import { ApiEndpointResolver } from "../api-endpoint-resolver.js";

function createTempDir(prefix: string): string {
  const dir = join(tmpdir(), `aegis-api-resolver-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function safeCleanup(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {}
}

describe("ApiEndpointResolver — Express Routes, Frontend API Calls & Prisma Correlation", () => {
  it("correlates Express routes, controller handlers, and frontend API client calls", () => {
    const testDir = createTempDir("api-correlate");
    try {
      mkdirSync(join(testDir, "server", "routes"), { recursive: true });
      mkdirSync(join(testDir, "server", "controllers"), { recursive: true });
      mkdirSync(join(testDir, "src", "services"), { recursive: true });

      writeFileSync(
        join(testDir, "server", "routes", "taskRoutes.ts"),
        `
import { Router } from "express";
import { taskController } from "../controllers/taskController";

const router = Router();
router.get("/api/tasks", taskController.getAll);
router.post("/api/tasks", taskController.create);
router.patch("/api/tasks/:id", taskController.update);
router.delete("/api/tasks/:id", taskController.delete);
export default router;
`,
        "utf8"
      );

      writeFileSync(
        join(testDir, "server", "controllers", "taskController.ts"),
        `
declare const prisma: any;

export const taskController = {
  async getAll(req: any, res: any) {
    const tasks = await prisma.task.findMany();
    res.json(tasks);
  },
  async create(req: any, res: any) {
    const { title, priority } = req.body;
    const task = await prisma.task.create({ data: { title, priority } });
    res.status(201).json(task);
  },
  async update(req: any, res: any) {
    const { id } = req.params;
    const task = await prisma.task.update({ where: { id }, data: req.body });
    res.json(task);
  },
  async delete(req: any, res: any) {
    const { id } = req.params;
    await prisma.task.delete({ where: { id } });
    res.status(204).send();
  }
};
`,
        "utf8"
      );

      writeFileSync(
        join(testDir, "src", "services", "taskService.ts"),
        `
declare const api: any;

export async function fetchTasks() {
  return api.get("/api/tasks");
}

export async function createTask(data: { title: string; priority?: string }) {
  return api.post("/api/tasks", data);
}

export async function updateTask(id: string, data: any) {
  return api.patch(\`/api/tasks/\${id}\`, data);
}
`,
        "utf8"
      );

      const symbolResolver = new SymbolReferenceResolver(testDir);
      symbolResolver.parseProject();

      const apiResolver = new ApiEndpointResolver(symbolResolver);
      const res = apiResolver.analyzeProject();

      expect(res.endpoints.length).toBe(4);
      expect(res.endpoints.some(e => e.method === "POST" && e.normalizedPath === "/api/tasks")).toBe(true);
      expect(res.endpoints.some(e => e.method === "PATCH" && e.normalizedPath === "/api/tasks/:id")).toBe(true);

      expect(res.frontendCalls.length).toBe(3);
      expect(res.frontendCalls.some(c => c.method === "POST" && c.normalizedPath === "/api/tasks")).toBe(true);
      expect(res.frontendCalls.some(c => c.method === "PATCH" && c.normalizedPath === "/api/tasks/:id")).toBe(true);

      expect(res.prismaAccesses.length).toBe(4);
      expect(res.prismaAccesses.some(a => a.modelName === "task" && a.methodName === "create")).toBe(true);

      const trace = apiResolver.findRouteTrace("POST", "/api/tasks");
      expect(trace.endpoints.length).toBe(1);
      expect(trace.frontendCalls.length).toBe(1);
      expect(trace.hasDynamicUrl).toBe(false);
    } finally {
      safeCleanup(testDir);
    }
  });

  it("Dynamic URL Safety: halts on computed template expressions api.get(`/api/${resource}`)", () => {
    const testDir = createTempDir("api-dynamic");
    try {
      mkdirSync(join(testDir, "src", "services"), { recursive: true });
      writeFileSync(
        join(testDir, "src", "services", "dynamicService.ts"),
        `
declare const api: any;
export function dynamicFetch(resource: string) {
  return api.get(\`/api/\${resource}\`);
}
`,
        "utf8"
      );

      const symbolResolver = new SymbolReferenceResolver(testDir);
      symbolResolver.parseProject();

      const apiResolver = new ApiEndpointResolver(symbolResolver);
      apiResolver.analyzeProject();

      expect(apiResolver.getUnsafePatterns().length).toBe(1);
      expect(apiResolver.getUnsafePatterns()[0].reason).toContain("DYNAMIC_API_URL");
    } finally {
      safeCleanup(testDir);
    }
  });
});
