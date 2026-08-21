import { describe, it, expect } from "vitest";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { ExistingSymbolModifier } from "../existing-symbol-modifier.js";
import { ASTSymbolPatchPlanner } from "../ast-symbol-patch-planner.js";

function createFixtureRepo(prefix: string): string {
  const dir = join(tmpdir(), `aegis-sym-mod-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  mkdirSync(dir, { recursive: true });

  // 1. package.json
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify(
      {
        name: "task-manager-app",
        version: "1.0.0",
        dependencies: { react: "^18.3.1", express: "^4.19.2" },
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

  // 2. src structure
  mkdirSync(join(dir, "src", "services"), { recursive: true });
  mkdirSync(join(dir, "src", "controllers"), { recursive: true });
  mkdirSync(join(dir, "src", "components"), { recursive: true });
  mkdirSync(join(dir, "src", "__tests__"), { recursive: true });

  writeFileSync(
    join(dir, "src", "services", "taskService.ts"),
    `
export interface Task { id: string; title: string; completed: boolean; }

export function updateTask(id: string, title: string): Task {
  return { id, title, completed: false };
}
`,
    "utf8"
  );

  writeFileSync(
    join(dir, "src", "controllers", "taskController.ts"),
    `
import { updateTask } from "../services/taskService";

export function handleUpdateTask(id: string, title: string) {
  return updateTask(id, title);
}
`,
    "utf8"
  );

  writeFileSync(
    join(dir, "src", "components", "TaskCard.tsx"),
    `
export function TaskCard({ task }: { task: { id: string; title: string } }) {
  return <div>{task.title}</div>;
}
`,
    "utf8"
  );

  writeFileSync(
    join(dir, "src", "components", "TaskList.tsx"),
    `
import { TaskCard } from "./TaskCard";

export function TaskList() {
  const item = { id: "1", title: "Test" };
  return (
    <div>
      <TaskCard task={item} />
    </div>
  );
}
`,
    "utf8"
  );

  writeFileSync(
    join(dir, "src", "__tests__", "taskService.test.ts"),
    `
import { updateTask } from "../services/taskService";
describe("taskService", () => {
  it("updates task", () => {
    expect(updateTask("1", "New")).toBeDefined();
  });
});
`,
    "utf8"
  );

  // 3. Git repo initialization
  execSync("git init", { cwd: dir, stdio: "ignore" });
  execSync("git config user.name 'Aegis Tester'", { cwd: dir, stdio: "ignore" });
  execSync("git config user.email 'tester@aegis.dev'", { cwd: dir, stdio: "ignore" });
  execSync("git add .", { cwd: dir, stdio: "ignore" });
  execSync('git commit -m "initial repository commit"', { cwd: dir, stdio: "ignore" });

  return dir;
}

function safeCleanup(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {}
}

describe("ExistingSymbolModifier — Multi-File E2E Fixture Matrix (Fixtures A–G)", () => {
  it("Fixture A: Function Body Update — modifies task update behavior across callers and tests", async () => {
    const fixtureDir = createFixtureRepo("fixture-a");
    try {
      const modifier = new ExistingSymbolModifier(fixtureDir);
      const planner = new ASTSymbolPatchPlanner(fixtureDir);

      // Plan function update
      const serviceOp = planner.planFunctionUpdate("src/services/taskService.ts", "updateTask", () => {
        return `export function updateTask(id: string, title: string): Task {\n  if (title === "") throw new Error("Title cannot be empty");\n  return { id, title, completed: false };\n}`;
      });

      const controllerOp = planner.planCallSiteUpdate("src/controllers/taskController.ts", "updateTask", (orig) => orig);

      const result = await modifier.modify({
        userRequest: "Disallow empty titles in task updates",
        targetSymbols: [{ filePath: "src/services/taskService.ts", symbolName: "updateTask" }],
        patches: [
          { filePath: "src/services/taskService.ts", operations: [serviceOp!] },
          { filePath: "src/controllers/taskController.ts", operations: controllerOp },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe("SUCCESS");
      expect(readFileSync(join(fixtureDir, "src/services/taskService.ts"), "utf8")).toContain('Title cannot be empty');

      // Verify git log
      const log = execSync("git log -n 1 --oneline", { cwd: fixtureDir, encoding: "utf8" });
      expect(log).toContain("refactor: update Disallow empty titles");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture B: Signature Change — updates function signature and all call sites in caller files", async () => {
    const fixtureDir = createFixtureRepo("fixture-b");
    try {
      const modifier = new ExistingSymbolModifier(fixtureDir);
      const planner = new ASTSymbolPatchPlanner(fixtureDir);

      const serviceOp = planner.planFunctionUpdate("src/services/taskService.ts", "updateTask", () => {
        return `export function updateTask(id: string, title: string, options?: { urgent?: boolean }): Task {\n  return { id, title, completed: false };\n}`;
      });

      const controllerOp = planner.planCallSiteUpdate("src/controllers/taskController.ts", "updateTask", (orig) => {
        return orig.replace(`(id, title)`, `(id, title, { urgent: true })`);
      });

      const result = await modifier.modify({
        userRequest: "Add urgent option to task update",
        targetSymbols: [{ filePath: "src/services/taskService.ts", symbolName: "updateTask" }],
        patches: [
          { filePath: "src/services/taskService.ts", operations: [serviceOp!] },
          { filePath: "src/controllers/taskController.ts", operations: controllerOp },
        ],
      });

      expect(result.success).toBe(true);
      expect(readFileSync(join(fixtureDir, "src/services/taskService.ts"), "utf8")).toContain("options?: { urgent?: boolean }");
      expect(readFileSync(join(fixtureDir, "src/controllers/taskController.ts"), "utf8")).toContain("{ urgent: true }");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture C: React Prop Addition — adds optional compact prop to TaskCard and updates JSX rendering parent", async () => {
    const fixtureDir = createFixtureRepo("fixture-c");
    try {
      const modifier = new ExistingSymbolModifier(fixtureDir);
      const planner = new ASTSymbolPatchPlanner(fixtureDir);

      const cardOp = planner.planFunctionUpdate("src/components/TaskCard.tsx", "TaskCard", () => {
        return `export function TaskCard({ task, compact }: { task: { id: string; title: string }; compact?: boolean }) {\n  return <div className={compact ? "compact" : "full"}>{task.title}</div>;\n}`;
      });

      const listOp = planner.planCallSiteUpdate("src/components/TaskList.tsx", "TaskCard", (orig) => {
        return orig.replace(`<TaskCard task={item} />`, `<TaskCard task={item} compact={true} />`);
      });

      const result = await modifier.modify({
        userRequest: "Add compact display prop to TaskCard",
        targetSymbols: [{ filePath: "src/components/TaskCard.tsx", symbolName: "TaskCard" }],
        patches: [
          { filePath: "src/components/TaskCard.tsx", operations: [cardOp!] },
          { filePath: "src/components/TaskList.tsx", operations: listOp },
        ],
      });

      expect(result.success).toBe(true);
      expect(readFileSync(join(fixtureDir, "src/components/TaskCard.tsx"), "utf8")).toContain("compact?: boolean");
      expect(readFileSync(join(fixtureDir, "src/components/TaskList.tsx"), "utf8")).toContain("compact={true}");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture D: Missing Impact — halts with MISSING_IMPACTED_FILE if a required caller is omitted", async () => {
    const fixtureDir = createFixtureRepo("fixture-d");
    try {
      const origService = readFileSync(join(fixtureDir, "src/services/taskService.ts"), "utf8");

      const modifier = new ExistingSymbolModifier(fixtureDir);
      const planner = new ASTSymbolPatchPlanner(fixtureDir);

      const serviceOp = planner.planFunctionUpdate("src/services/taskService.ts", "updateTask", () => "export function updateTask() {}");

      // Intentionally omit src/controllers/taskController.ts from patch plan
      const result = await modifier.modify({
        userRequest: "Omit controller caller test",
        targetSymbols: [{ filePath: "src/services/taskService.ts", symbolName: "updateTask" }],
        patches: [
          { filePath: "src/services/taskService.ts", operations: [serviceOp!] },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe("MISSING_IMPACTED_FILE");
      expect(result.error).toContain("taskController.ts");
      expect(readFileSync(join(fixtureDir, "src/services/taskService.ts"), "utf8")).toBe(origService);
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture E: Unauthorized Patch — halts with UNAUTHORIZED_FILE_IN_PATCH if unrelated file is included", async () => {
    const fixtureDir = createFixtureRepo("fixture-e");
    try {
      const modifier = new ExistingSymbolModifier(fixtureDir);
      const planner = new ASTSymbolPatchPlanner(fixtureDir);

      const serviceOp = planner.planFunctionUpdate("src/services/taskService.ts", "updateTask", () => "export function updateTask() {}");
      const controllerOp = planner.planCallSiteUpdate("src/controllers/taskController.ts", "updateTask", (orig) => orig);

      // Unrelated file included in patches
      const result = await modifier.modify({
        userRequest: "Unauthorized file test",
        targetSymbols: [{ filePath: "src/services/taskService.ts", symbolName: "updateTask" }],
        patches: [
          { filePath: "src/services/taskService.ts", operations: [serviceOp!] },
          { filePath: "src/controllers/taskController.ts", operations: controllerOp },
          { filePath: "src/components/TaskCard.tsx", operations: [] },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe("UNAUTHORIZED_FILE_IN_PATCH");
      expect(result.error).toContain("TaskCard.tsx");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture F: Runtime Regression — triggers exact transactional rollback on test failure", async () => {
    const fixtureDir = createFixtureRepo("fixture-f");
    try {
      const origService = readFileSync(join(fixtureDir, "src/services/taskService.ts"), "utf8");
      const origController = readFileSync(join(fixtureDir, "src/controllers/taskController.ts"), "utf8");

      // Configure test script to pass on clean code, and fail if REGRESSION_FLAG is found
      writeFileSync(
        join(fixtureDir, "run-tests.cjs"),
        `const fs = require('fs');
const s = fs.readFileSync('src/services/taskService.ts', 'utf8');
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

      const serviceOp = planner.planFunctionUpdate("src/services/taskService.ts", "updateTask", () => "export function updateTask() {\n  throw new Error('REGRESSION_FLAG');\n}");
      const controllerOp = planner.planCallSiteUpdate("src/controllers/taskController.ts", "updateTask", (orig) => orig);

      const result = await modifier.modify({
        userRequest: "Trigger regression",
        targetSymbols: [{ filePath: "src/services/taskService.ts", symbolName: "updateTask" }],
        patches: [
          { filePath: "src/services/taskService.ts", operations: [serviceOp!] },
          { filePath: "src/controllers/taskController.ts", operations: controllerOp },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe("TEST_REGRESSION");
      expect(result.checkpointRolledBack).toBe(true);
      expect(readFileSync(join(fixtureDir, "src/services/taskService.ts"), "utf8")).toBe(origService);
      expect(readFileSync(join(fixtureDir, "src/controllers/taskController.ts"), "utf8")).toBe(origController);
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture G: Dirty Target in Multi-File Closure — halts with GIT_DIRTY_TARGET before modifying any file", async () => {
    const fixtureDir = createFixtureRepo("fixture-g");
    try {
      const origService = readFileSync(join(fixtureDir, "src/services/taskService.ts"), "utf8");

      // User has uncommitted changes in taskController.ts while preserving import of updateTask
      writeFileSync(
        join(fixtureDir, "src/controllers/taskController.ts"),
        `// user working edits\nimport { updateTask } from "../services/taskService";\nexport function handleUpdateTask(id: string, title: string) {\n  return updateTask(id, title);\n}\n`,
        "utf8"
      );

      const modifier = new ExistingSymbolModifier(fixtureDir);
      const planner = new ASTSymbolPatchPlanner(fixtureDir);

      const serviceOp = planner.planFunctionUpdate("src/services/taskService.ts", "updateTask", () => "export function updateTask() {}");
      const controllerOp = planner.planCallSiteUpdate("src/controllers/taskController.ts", "updateTask", (orig) => orig);

      const result = await modifier.modify({
        userRequest: "Dirty target test",
        targetSymbols: [{ filePath: "src/services/taskService.ts", symbolName: "updateTask" }],
        patches: [
          { filePath: "src/services/taskService.ts", operations: [serviceOp!] },
          { filePath: "src/controllers/taskController.ts", operations: controllerOp },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe("GIT_DIRTY_TARGET");
      expect(result.error).toContain("GIT_DIRTY_TARGET");

      // Verify service file was not touched
      expect(readFileSync(join(fixtureDir, "src/services/taskService.ts"), "utf8")).toBe(origService);
    } finally {
      safeCleanup(fixtureDir);
    }
  });
});
