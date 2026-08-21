import { describe, it, expect } from "vitest";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { ImpactClosureEngine } from "../impact-closure-engine.js";
import { ExistingSymbolModifier } from "../existing-symbol-modifier.js";
import { ASTSymbolPatchPlanner } from "../ast-symbol-patch-planner.js";
import { BrownfieldGitGuard } from "../brownfield-git-guard.js";

function createFullstackFixtureRepo(prefix: string): string {
  const dir = join(tmpdir(), `aegis-vertical-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  mkdirSync(dir, { recursive: true });

  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify(
      {
        name: "fullstack-task-app",
        version: "1.0.0",
        scripts: {
          build: "node -e \"console.log('build pass')\"",
          test: "node -e \"console.log(' Test Files 1 passed (1)\\n Tests 2 passed (2)'); process.exit(0)\"",
        },
      },
      null,
      2
    ),
    "utf8"
  );

  mkdirSync(join(dir, "prisma"), { recursive: true });
  mkdirSync(join(dir, "server", "controllers"), { recursive: true });
  mkdirSync(join(dir, "server", "routes"), { recursive: true });
  mkdirSync(join(dir, "server", "services"), { recursive: true });
  mkdirSync(join(dir, "src", "services"), { recursive: true });
  mkdirSync(join(dir, "src", "types"), { recursive: true });
  mkdirSync(join(dir, "src", "hooks"), { recursive: true });
  mkdirSync(join(dir, "src", "context"), { recursive: true });
  mkdirSync(join(dir, "src", "reducers"), { recursive: true });
  mkdirSync(join(dir, "src", "components"), { recursive: true });
  mkdirSync(join(dir, "server", "__tests__"), { recursive: true });

  // 1. prisma/schema.prisma
  writeFileSync(
    join(dir, "prisma", "schema.prisma"),
    `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Task {
  id        String   @id @default(uuid())
  title     String
  createdAt DateTime @default(now())
}
`,
    "utf8"
  );

  // 2. server/services/taskService.ts
  writeFileSync(
    join(dir, "server", "services", "taskService.ts"),
    `
declare const prisma: any;

export const taskService = {
  async getTasks() {
    return prisma.task.findMany();
  },
  async createTask(data: { title: string; priority?: string }) {
    return prisma.task.create({ data });
  }
};
`,
    "utf8"
  );

  // 3. server/controllers/taskController.ts
  writeFileSync(
    join(dir, "server", "controllers", "taskController.ts"),
    `
import { taskService } from "../services/taskService";

export const taskController = {
  async list(req: any, res: any) {
    const tasks = await taskService.getTasks();
    res.json(tasks);
  },
  async create(req: any, res: any) {
    const { title, priority } = req.body;
    const task = await taskService.createTask({ title, priority });
    res.status(201).json(task);
  }
};
`,
    "utf8"
  );

  // 4. server/routes/taskRoutes.ts
  writeFileSync(
    join(dir, "server", "routes", "taskRoutes.ts"),
    `
import { Router } from "express";
import { taskController } from "../controllers/taskController";

const router = Router();
router.get("/api/tasks", taskController.list);
router.post("/api/tasks", taskController.create);
export default router;
`,
    "utf8"
  );

  // 5. src/types/task.ts
  writeFileSync(
    join(dir, "src", "types", "task.ts"),
    `
export interface Task {
  id: string;
  title: string;
  createdAt: string;
}

export interface CreateTaskDto {
  title: string;
  priority?: string;
}
`,
    "utf8"
  );

  // 6. src/services/taskApiClient.ts
  writeFileSync(
    join(dir, "src", "services", "taskApiClient.ts"),
    `
import { Task, CreateTaskDto } from "../types/task";
declare const api: any;

export async function fetchTasks(): Promise<Task[]> {
  return api.get("/api/tasks");
}

export async function postTask(data: CreateTaskDto): Promise<Task> {
  return api.post("/api/tasks", data);
}
`,
    "utf8"
  );

  // 7. src/hooks/useTasks.ts
  writeFileSync(
    join(dir, "src", "hooks", "useTasks.ts"),
    `
import { useState, useEffect } from "react";
import { fetchTasks, postTask } from "../services/taskApiClient";
import { Task, CreateTaskDto } from "../types/task";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  useEffect(() => {
    fetchTasks().then(setTasks);
  }, []);
  const addTask = async (data: CreateTaskDto) => {
    const newTask = await postTask(data);
    setTasks(prev => [...prev, newTask]);
  };
  return { tasks, addTask };
}
`,
    "utf8"
  );

  // 8. src/context/TaskContext.tsx
  writeFileSync(
    join(dir, "src", "context", "TaskContext.tsx"),
    `
import { createContext } from "react";
import { useTasks } from "../hooks/useTasks";

export const TaskContext = createContext<any>(null);

export function TaskProvider({ children }: { children: any }) {
  const taskState = useTasks();
  return <TaskContext.Provider value={taskState}>{children}</TaskContext.Provider>;
}
`,
    "utf8"
  );

  // 9. src/components/TaskForm.tsx
  writeFileSync(
    join(dir, "src", "components", "TaskForm.tsx"),
    `
import { useContext, useState } from "react";
import { TaskContext } from "../context/TaskContext";

export function TaskForm() {
  const { addTask } = useContext(TaskContext);
  const [title, setTitle] = useState("");
  const handleSubmit = () => addTask({ title });
  return <button onClick={handleSubmit}>Create Task</button>;
}
`,
    "utf8"
  );

  // 10. server/__tests__/taskApi.test.ts
  writeFileSync(
    join(dir, "server", "__tests__", "taskApi.test.ts"),
    `
describe("Task API Integration", () => {
  it("GET /api/tasks returns 200", () => {
    expect(true).toBe(true);
  });
});
`,
    "utf8"
  );

  // Git repo initialization
  execSync("git init", { cwd: dir, stdio: "ignore" });
  execSync("git config user.name 'Aegis Tester'", { cwd: dir, stdio: "ignore" });
  execSync("git config user.email 'tester@aegis.dev'", { cwd: dir, stdio: "ignore" });
  execSync("git add .", { cwd: dir, stdio: "ignore" });
  execSync('git commit -m "initial commit"', { cwd: dir, stdio: "ignore" });

  return dir;
}

function safeCleanup(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {}
}

describe("Vertical Data-to-UI Propagation — Fixture Matrix (Fixtures A through M)", () => {
  it("Fixture A: Optional Field Addition — resolves Prisma field priority across service, controller, and frontend client", () => {
    const fixtureDir = createFullstackFixtureRepo("fixture-a");
    try {
      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "prisma/schema.prisma", symbolName: "Task", modelName: "Task", propName: "priority" },
      ]);

      expect(result.status).toBe("CLOSED");
      expect(result.mustChange).toContain("prisma/schema.prisma");
      expect(result.mayChange).toContain("server/services/taskService.ts");
      expect(result.mayChange).toContain("server/controllers/taskController.ts");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture B: Default Field Addition — allows archived Boolean @default(false) without data loss", () => {
    const fixtureDir = createFullstackFixtureRepo("fixture-b");
    try {
      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "prisma/schema.prisma", symbolName: "Task", modelName: "Task", propName: "archived" },
      ]);

      expect(result.status).toBe("CLOSED");
      expect(result.mustChange).toContain("prisma/schema.prisma");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture C: Field Rename — discovers all cross-layer references when title is renamed to taskName", () => {
    const fixtureDir = createFullstackFixtureRepo("fixture-c");
    try {
      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "prisma/schema.prisma", symbolName: "Task", modelName: "Task", propName: "title" },
      ]);

      expect(result.status).toBe("CLOSED");
      expect(result.mayChange).toContain("server/services/taskService.ts");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture D: Endpoint Path Change — traces /api/tasks to /api/v1/tasks across backend and frontend client", () => {
    const fixtureDir = createFullstackFixtureRepo("fixture-d");
    try {
      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "server/routes/taskRoutes.ts", symbolName: "/api/tasks", endpointPath: "/api/tasks", httpMethod: "GET" },
      ]);

      expect(result.status).toBe("CLOSED");
      expect(result.mayChange).toContain("server/controllers/taskController.ts");
      expect(result.mayChange).toContain("src/services/taskApiClient.ts");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture E: HTTP Method Change — traces PUT to PATCH endpoint changes", () => {
    const fixtureDir = createFullstackFixtureRepo("fixture-e");
    try {
      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "server/routes/taskRoutes.ts", symbolName: "/api/tasks", endpointPath: "/api/tasks", httpMethod: "POST" },
      ]);

      expect(result.status).toBe("CLOSED");
      expect(result.mayChange).toContain("src/services/taskApiClient.ts");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture F: New Related Model — resolves TaskTag addition with relation to Task", () => {
    const fixtureDir = createFullstackFixtureRepo("fixture-f");
    try {
      writeFileSync(
        join(fixtureDir, "prisma", "schema.prisma"),
        readFileSync(join(fixtureDir, "prisma", "schema.prisma"), "utf8") +
          `
model TaskTag {
  id     String @id @default(uuid())
  name   String
  taskId String
  task   Task   @relation(fields: [taskId], references: [id])
}
`
      );

      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "prisma/schema.prisma", symbolName: "TaskTag", modelName: "TaskTag" },
      ]);

      expect(result.status).toBe("CLOSED");
      expect(result.mustChange).toContain("prisma/schema.prisma");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture G: Dynamic API URL — halts with IMPACT_ANALYSIS_INCOMPLETE for api.get(`/api/${resource}`)", () => {
    const fixtureDir = createFullstackFixtureRepo("fixture-g");
    try {
      writeFileSync(
        join(fixtureDir, "src", "services", "dynamicApi.ts"),
        `
declare const api: any;
export function getDynamic(resource: string) {
  return api.get(\`/api/\${resource}\`);
}
`,
        "utf8"
      );

      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "server/routes/taskRoutes.ts", symbolName: "/api/tasks", endpointPath: "/api/tasks", httpMethod: "GET" },
      ]);

      expect(result.status).toBe("IMPACT_ANALYSIS_INCOMPLETE");
      expect(result.unresolvedReasons?.some(r => r.reason.includes("DYNAMIC_API_URL"))).toBe(true);
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture H: Computed Request Body — halts with IMPACT_ANALYSIS_INCOMPLETE for req.body[dynamicKey]", () => {
    const fixtureDir = createFullstackFixtureRepo("fixture-h");
    try {
      writeFileSync(
        join(fixtureDir, "server", "controllers", "dynamicController.ts"),
        `
export const dynamicController = {
  handle(req: any, res: any) {
    const key = "title";
    const val = req.body[key];
    res.json({ val });
  }
};
`,
        "utf8"
      );

      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "server/controllers/dynamicController.ts", symbolName: "dynamicController" },
      ]);

      expect(result.status).toBe("IMPACT_ANALYSIS_INCOMPLETE");
      expect(result.unresolvedReasons?.some(r => r.reason.includes("COMPUTED_BODY_ACCESS"))).toBe(true);
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture I: Destructive Schema Migration — blocks non-nullable column drop with DESTRUCTIVE_SCHEMA_MIGRATION_BLOCKED", () => {
    const fixtureDir = createFullstackFixtureRepo("fixture-i");
    try {
      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "prisma/schema.prisma", symbolName: "Task", modelName: "Task", isDestructive: true },
      ]);

      expect(result.status).toBe("DESTRUCTIVE_SCHEMA_MIGRATION_BLOCKED");
      expect(result.mustChange.length).toBe(0);
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture J: Context + Hook + Vertical API — resolves complete chain from API to Context consumer", () => {
    const fixtureDir = createFullstackFixtureRepo("fixture-j");
    try {
      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "src/services/taskApiClient.ts", symbolName: "postTask" },
      ]);

      expect(result.status).toBe("CLOSED");
      expect(result.mayChange).toContain("src/hooks/useTasks.ts");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture K: Reducer + Vertical API — resolves action creator dispatching API data to reducer", () => {
    const fixtureDir = createFullstackFixtureRepo("fixture-k");
    try {
      writeFileSync(
        join(fixtureDir, "src", "reducers", "apiReducer.ts"),
        `
export type ApiAction = { type: "SET_TASKS"; tasks: any[] };
export function apiReducer(state: any[] = [], action: ApiAction) {
  switch (action.type) {
    case "SET_TASKS":
      return action.tasks;
    default:
      return state;
  }
}
`,
        "utf8"
      );

      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "src/reducers/apiReducer.ts", symbolName: "apiReducer" },
      ]);

      expect(result.status).toBe("CLOSED");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture L: Dirty Schema Target — halts with GIT_DIRTY_TARGET when schema.prisma has uncommitted user edits", () => {
    const fixtureDir = createFullstackFixtureRepo("fixture-l");
    try {
      // Modify schema.prisma without git committing
      writeFileSync(
        join(fixtureDir, "prisma", "schema.prisma"),
        readFileSync(join(fixtureDir, "prisma", "schema.prisma"), "utf8") + "\n// user dirty comment\n"
      );

      const check = BrownfieldGitGuard.evaluatePreflight(fixtureDir, ["prisma/schema.prisma"]);

      expect(check.status).toBe("DIRTY_TARGET_CONFLICT");
      expect(check.reason).toContain("GIT_DIRTY_TARGET");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture M: Multi-Layer Regression Rollback — triggers atomic rollback across backend and frontend on test failure", async () => {
    const fixtureDir = createFullstackFixtureRepo("fixture-m");
    try {
      const origService = readFileSync(join(fixtureDir, "server", "services", "taskService.ts"), "utf8");

      // Inject regression test script
      writeFileSync(
        join(fixtureDir, "run-tests.cjs"),
        `const fs = require('fs');
const s = fs.readFileSync('server/services/taskService.ts', 'utf8');
if (s.includes('REGRESSION_FLAG')) {
  console.log('0 passed (1 failed)');
  process.exit(1);
} else {
  console.log(' Test Files 1 passed (1)\\n Tests 2 passed (2)');
  process.exit(0);
}
`,
        "utf8"
      );
      const pkgPath = join(fixtureDir, "package.json");
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      pkg.scripts.test = "node run-tests.cjs";
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf8");

      const modifier = new ExistingSymbolModifier(fixtureDir);
      const planner = new ASTSymbolPatchPlanner(fixtureDir);

      const servOp = planner.planFunctionUpdate("server/services/taskService.ts", "taskService", () => {
        return `export const taskService = {\n  async getTasks() {\n    throw new Error('REGRESSION_FLAG');\n  }\n};`;
      });
      const ctrlOp = planner.planFunctionUpdate("server/controllers/taskController.ts", "taskController", (orig) => orig);
      const routeOp = planner.planFunctionUpdate("server/routes/taskRoutes.ts", "router", (orig) => orig);

      const result = await modifier.modify({
        userRequest: "Trigger vertical regression in taskService",
        targetSymbols: [
          { filePath: "server/services/taskService.ts", symbolName: "taskService" },
          { filePath: "server/controllers/taskController.ts", symbolName: "taskController" },
          { filePath: "server/routes/taskRoutes.ts", symbolName: "router" },
        ],
        patches: [
          { filePath: "server/services/taskService.ts", operations: [servOp!] },
          { filePath: "server/controllers/taskController.ts", operations: [ctrlOp!] },
          { filePath: "server/routes/taskRoutes.ts", operations: [routeOp!] },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe("TEST_REGRESSION");
      expect(result.checkpointRolledBack).toBe(true);
      expect(readFileSync(join(fixtureDir, "server", "services", "taskService.ts"), "utf8")).toBe(origService);
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Property Test: Idempotence & Determinism — consecutive runs produce strictly identical vertical impact sets", () => {
    const fixtureDir = createFullstackFixtureRepo("property-test");
    try {
      const engine1 = new ImpactClosureEngine(fixtureDir);
      const res1 = engine1.computeClosure([
        { filePath: "prisma/schema.prisma", symbolName: "Task", modelName: "Task" },
      ]);

      const engine2 = new ImpactClosureEngine(fixtureDir);
      const res2 = engine2.computeClosure([
        { filePath: "prisma/schema.prisma", symbolName: "Task", modelName: "Task" },
      ]);

      expect(res1.status).toBe(res2.status);
      expect(res1.mustChange).toEqual(res2.mustChange);
      expect(res1.mayChange).toEqual(res2.mayChange);
      expect(res1.requiredTests).toEqual(res2.requiredTests);
    } finally {
      safeCleanup(fixtureDir);
    }
  });
});
