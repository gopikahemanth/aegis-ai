import { describe, it, expect } from "vitest";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { BrownfieldWorkflowEngine } from "../brownfield-workflow-engine.js";
import { RepositoryScanner } from "../repository-scanner.js";

function createFixtureRepo(prefix: string): string {
  const dir = join(tmpdir(), `aegis-e2e-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  mkdirSync(dir, { recursive: true });

  // 1. package.json
  writeFileSync(join(dir, "package.json"), JSON.stringify({
    name: "task-manager-app",
    version: "1.0.0",
    dependencies: { react: "^18.3.1", "react-dom": "^18.3.1", express: "^4.19.2" },
    scripts: {
      build: "node -e \"console.log('build pass')\"",
      test: "node -e \"console.log(' Test Files 1 passed (1)\\n Tests 2 passed (2)'); process.exit(0)\""
    }
  }, null, 2), "utf8");

  // 2. src structure
  mkdirSync(join(dir, "src", "features", "tasks"), { recursive: true });
  mkdirSync(join(dir, "src", "__tests__"), { recursive: true });
  mkdirSync(join(dir, "server", "routes"), { recursive: true });

  writeFileSync(join(dir, "src", "routes.tsx"), `export const routes = [
  { path: "/tasks", element: "<TaskList />" }
];
`, "utf8");

  writeFileSync(join(dir, "src", "features", "tasks", "TaskList.tsx"), `export function TaskList() {
  return "TaskList";
}
`, "utf8");

  writeFileSync(join(dir, "src", "__tests__", "task-list.test.ts"), `import { describe, it, expect } from "vitest";
describe("TaskList", () => {
  it("renders task list correctly", () => {
    expect(1 + 1).toBe(2);
  });
});
`, "utf8");

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

describe("Brownfield E2E Scenario Matrix", () => {
  it("Scenario 1: Clean Repository Additive Feature — creates new module, patches routes, stages touched files only", async () => {
    const fixtureDir = createFixtureRepo("scenario-1-clean");
    try {
      const engine = new BrownfieldWorkflowEngine();

      const result = await engine.execute(fixtureDir, "Add CSV export for tasks", {
        newFiles: [
          {
            path: "src/features/tasks/csvExport.ts",
            content: `export function exportTasksToCsv(tasks: any[]) {\n  return "id,title\\n";\n}\n`,
            symbols: ["exportTasksToCsv"]
          }
        ],
        surgicalEdits: [
          {
            path: "src/routes.tsx",
            search: '{ path: "/tasks", element: "<TaskList />" }',
            replace: '{ path: "/tasks", element: "<TaskList />" },\n  { path: "/tasks/export", element: "<TaskExport />" }',
            reason: "Register CSV export route",
            symbols: ["TaskExport"]
          }
        ]
      });

      expect(result.success).toBe(true);
      expect(result.touchedFiles).toContain("src/features/tasks/csvExport.ts");
      expect(result.touchedFiles).toContain("src/routes.tsx");
      expect(existsSync(join(fixtureDir, "src/features/tasks/csvExport.ts"))).toBe(true);
      expect(readFileSync(join(fixtureDir, "src/routes.tsx"), "utf8")).toContain("/tasks/export");

      // Verify git log has new commit
      const log = execSync("git log -n 1 --oneline", { cwd: fixtureDir, encoding: "utf8" });
      expect(log).toContain("feat: add Add CSV export for tasks");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Scenario 2: Dirty Unrelated File — preserves user edits and stages only Aegis-touched files", async () => {
    const fixtureDir = createFixtureRepo("scenario-2-unrelated");
    try {
      // User creates and modifies an unrelated file
      writeFileSync(join(fixtureDir, "notes.txt"), "User notes in progress", "utf8");
      writeFileSync(join(fixtureDir, "src", "features", "tasks", "TaskList.tsx"), `// user working edits\nexport function TaskList() {\n  return "TaskList";\n}\n`, "utf8");

      const engine = new BrownfieldWorkflowEngine();

      const result = await engine.execute(fixtureDir, "Add CSV export for tasks", {
        newFiles: [
          {
            path: "src/features/tasks/csvExport.ts",
            content: `export function exportTasksToCsv() { return ""; }\n`,
            symbols: ["exportTasksToCsv"]
          }
        ],
        surgicalEdits: [
          {
            path: "src/routes.tsx",
            search: '{ path: "/tasks", element: "<TaskList />" }',
            replace: '{ path: "/tasks", element: "<TaskList />" },\n  { path: "/tasks/export", element: "<TaskExport />" }',
            reason: "Register CSV export route",
            symbols: ["TaskExport"]
          }
        ]
      });

      expect(result.success).toBe(true);

      // Verify unrelated files remain preserved and unstaged
      const status = execSync("git status --porcelain", { cwd: fixtureDir, encoding: "utf8" });
      expect(status).toContain("?? notes.txt");
      expect(status).toContain("M src/features/tasks/TaskList.tsx");
      expect(status).not.toContain("csvExport.ts");
      expect(status).not.toContain("routes.tsx");
      expect(readFileSync(join(fixtureDir, "notes.txt"), "utf8")).toBe("User notes in progress");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Scenario 3: Dirty Target Conflict — aborts safely with GIT_DIRTY_TARGET and zero file overwrites", async () => {
    const fixtureDir = createFixtureRepo("scenario-3-conflict");
    try {
      // User modifies the exact file that Aegis intends to patch without committing
      writeFileSync(join(fixtureDir, "src", "routes.tsx"), `// uncommitted user route changes\nexport const routes = [];\n`, "utf8");

      const engine = new BrownfieldWorkflowEngine();

      const result = await engine.execute(fixtureDir, "Add CSV export for tasks", {
        newFiles: [],
        surgicalEdits: [
          {
            path: "src/routes.tsx",
            search: "routes = []",
            replace: "routes = [{ path: '/export' }]",
            reason: "Patch route"
          }
        ]
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("GIT_DIRTY_TARGET");

      // Verify user file was not overwritten
      expect(readFileSync(join(fixtureDir, "src", "routes.tsx"), "utf8")).toBe(`// uncommitted user route changes\nexport const routes = [];\n`);
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Scenario 4: Intentional Regression — triggers transaction rollback to exact pre-change state", async () => {
    const fixtureDir = createFixtureRepo("scenario-4-regression");
    try {
      const origRoutes = readFileSync(join(fixtureDir, "src", "routes.tsx"), "utf8");

      const engine = new BrownfieldWorkflowEngine();

      // Configure a failing post-change patch (e.g. symbol collision or invalid patch)
      const result = await engine.execute(fixtureDir, "Add CSV export for tasks", {
        newFiles: [
          {
            path: "src/features/tasks/csvExport.ts",
            content: "export const exportTasks = 1;",
            symbols: ["TaskList"] // Collision with TaskList
          }
        ],
        surgicalEdits: [
          {
            path: "src/features/tasks/TaskList.tsx",
            search: "export function TaskList",
            replace: "export function TaskList",
            reason: "Collision test",
            symbols: ["TaskList"]
          }
        ]
      });

      expect(result.success).toBe(false);
      expect(result.checkpointRolledBack).toBe(undefined); // Halted before checkpoint due to collision check

      // Test runtime regression trigger
      const result2 = await engine.execute(fixtureDir, "Add CSV export for tasks", {
        newFiles: [
          {
            path: "src/features/tasks/csvExport.ts",
            content: "export const exportTasks = 1;",
          }
        ],
        surgicalEdits: [
          {
            path: "src/routes.tsx",
            search: "NON_EXISTENT_SEARCH_STRING_FOR_ERROR",
            replace: "REPLACE",
            reason: "Failing edit"
          }
        ]
      });

      expect(result2.success).toBe(false);
      expect(result2.error).toContain("SEARCH_BLOCK_NOT_FOUND");
      expect(readFileSync(join(fixtureDir, "src", "routes.tsx"), "utf8")).toBe(origRoutes);
      expect(existsSync(join(fixtureDir, "src/features/tasks/csvExport.ts"))).toBe(false);
    } finally {
      safeCleanup(fixtureDir);
    }
  });
});
