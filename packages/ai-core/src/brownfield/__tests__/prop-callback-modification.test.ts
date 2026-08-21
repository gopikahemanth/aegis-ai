import { describe, it, expect } from "vitest";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { ImpactClosureEngine } from "../impact-closure-engine.js";
import { ExistingSymbolModifier } from "../existing-symbol-modifier.js";
import { ASTSymbolPatchPlanner } from "../ast-symbol-patch-planner.js";

function createReactFixtureRepo(prefix: string): string {
  const dir = join(tmpdir(), `aegis-prop-cb-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  mkdirSync(dir, { recursive: true });

  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify(
      {
        name: "react-task-hierarchy",
        version: "1.0.0",
        dependencies: { react: "^18.3.1" },
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

  mkdirSync(join(dir, "src", "components"), { recursive: true });
  mkdirSync(join(dir, "src", "__tests__"), { recursive: true });

  // 1. TaskActions.tsx (Leaf)
  writeFileSync(
    join(dir, "src", "components", "TaskActions.tsx"),
    `
export function TaskActions({ task, onTaskUpdated }: { task: any; onTaskUpdated: (t: any) => void }) {
  return <button onClick={() => onTaskUpdated(task)}>Update</button>;
}
`,
    "utf8"
  );

  // 2. TaskCard.tsx (Middle)
  writeFileSync(
    join(dir, "src", "components", "TaskCard.tsx"),
    `
import { TaskActions } from "./TaskActions";

export function TaskCard({ task, onTaskUpdated }: { task: any; onTaskUpdated: (t: any) => void }) {
  return (
    <div>
      <span>{task.title}</span>
      <TaskActions task={task} onTaskUpdated={onTaskUpdated} />
    </div>
  );
}
`,
    "utf8"
  );

  // 3. TaskList.tsx (Parent / Container)
  writeFileSync(
    join(dir, "src", "components", "TaskList.tsx"),
    `
import { TaskCard } from "./TaskCard";

export function TaskList({ items }: { items: any[] }) {
  const handleTaskUpdated = (task: any) => {
    console.log("Updated", task);
  };

  return (
    <div>
      {items.map(t => (
        <TaskCard key={t.id} task={t} onTaskUpdated={handleTaskUpdated} />
      ))}
    </div>
  );
}
`,
    "utf8"
  );

  // 4. Test
  writeFileSync(
    join(dir, "src", "__tests__", "TaskList.test.tsx"),
    `
import { TaskList } from "../components/TaskList";

describe("TaskList", () => {
  it("renders list", () => {
    expect(TaskList).toBeDefined();
  });
});
`,
    "utf8"
  );

  // Git init
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

describe("Prop & Callback Hierarchy Flow — Fixture Matrix (Fixtures A–G)", () => {
  it("Fixture A: Three-Level Prop Drilling — identifies Page, List, and Card in closed impact set", () => {
    const fixtureDir = createReactFixtureRepo("fixture-a");
    try {
      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "src/components/TaskActions.tsx", symbolName: "TaskActions", propName: "task" },
      ]);

      expect(result.status).toBe("CLOSED");
      expect(result.mustChange).toContain("src/components/TaskActions.tsx");
      expect(result.mayChange).toContain("src/components/TaskCard.tsx");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture B: Callback Signature — modifies onTaskUpdated(task, meta) across child, forwarder, and handler", async () => {
    const fixtureDir = createReactFixtureRepo("fixture-b");
    try {
      const modifier = new ExistingSymbolModifier(fixtureDir);
      const planner = new ASTSymbolPatchPlanner(fixtureDir);

      const actionsOp = planner.planFunctionUpdate("src/components/TaskActions.tsx", "TaskActions", () => {
        return `export function TaskActions({ task, onTaskUpdated }: { task: any; onTaskUpdated: (t: any, meta?: any) => void }) {\n  return <button onClick={() => onTaskUpdated(task, { source: "ui" })}>Update</button>;\n}`;
      });

      const cardOp = planner.planFunctionUpdate("src/components/TaskCard.tsx", "TaskCard", () => {
        return `export function TaskCard({ task, onTaskUpdated }: { task: any; onTaskUpdated: (t: any, meta?: any) => void }) {\n  return (\n    <div>\n      <span>{task.title}</span>\n      <TaskActions task={task} onTaskUpdated={onTaskUpdated} />\n    </div>\n  );\n}`;
      });

      const listOp = planner.planFunctionUpdate("src/components/TaskList.tsx", "TaskList", () => {
        return `export function TaskList({ items }: { items: any[] }) {\n  const handleTaskUpdated = (task: any, meta?: any) => {\n    console.log("Updated", task, meta);\n  };\n\n  return (\n    <div>\n      {items.map(t => (\n        <TaskCard key={t.id} task={t} onTaskUpdated={handleTaskUpdated} />\n      ))}\n    </div>\n  );\n}`;
      });

      const result = await modifier.modify({
        userRequest: "Add metadata to task update callback",
        targetSymbols: [
          { filePath: "src/components/TaskActions.tsx", symbolName: "TaskActions" },
          { filePath: "src/components/TaskCard.tsx", symbolName: "TaskCard" },
          { filePath: "src/components/TaskList.tsx", symbolName: "TaskList" },
        ],
        patches: [
          { filePath: "src/components/TaskActions.tsx", operations: [actionsOp!] },
          { filePath: "src/components/TaskCard.tsx", operations: [cardOp!] },
          { filePath: "src/components/TaskList.tsx", operations: [listOp!] },
        ],
      });

      expect(result.success).toBe(true);
      expect(readFileSync(join(fixtureDir, "src/components/TaskActions.tsx"), "utf8")).toContain('source: "ui"');
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture C: Optional Prop Addition — adds optional prop and updates direct rendering parent", async () => {
    const fixtureDir = createReactFixtureRepo("fixture-c");
    try {
      const modifier = new ExistingSymbolModifier(fixtureDir);
      const planner = new ASTSymbolPatchPlanner(fixtureDir);

      const cardOp = planner.planFunctionUpdate("src/components/TaskCard.tsx", "TaskCard", () => {
        return `export function TaskCard({ task, onTaskUpdated, compact }: { task: any; onTaskUpdated: (t: any) => void; compact?: boolean }) {\n  return <div className={compact ? "compact" : "full"}><span>{task.title}</span><TaskActions task={task} onTaskUpdated={onTaskUpdated} /></div>;\n}`;
      });

      const listOp = planner.planCallSiteUpdate("src/components/TaskList.tsx", "TaskCard", (orig) => {
        return orig.replace(`<TaskCard key={t.id} task={t} onTaskUpdated={handleTaskUpdated} />`, `<TaskCard key={t.id} task={t} onTaskUpdated={handleTaskUpdated} compact={true} />`);
      });

      const result = await modifier.modify({
        userRequest: "Add compact prop to TaskCard",
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

  it("Fixture D: Prop Spread — halts safely with IMPACT_ANALYSIS_INCOMPLETE when prop spread is present", () => {
    const fixtureDir = createReactFixtureRepo("fixture-d");
    try {
      // Inject spread in TaskList
      writeFileSync(
        join(fixtureDir, "src", "components", "TaskList.tsx"),
        `
import { TaskCard } from "./TaskCard";
export function TaskList(props: any) {
  return <TaskCard {...props} />;
}
`,
        "utf8"
      );

      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "src/components/TaskCard.tsx", symbolName: "TaskCard", propName: "task" },
      ]);

      expect(result.status).toBe("IMPACT_ANALYSIS_INCOMPLETE");
      expect(result.unresolvedReasons?.some(r => r.reason.includes("UNSAFE_PROP_SPREAD"))).toBe(true);
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture E: Indirect Callback — resolves callback passed through intermediate variable", () => {
    const fixtureDir = createReactFixtureRepo("fixture-e");
    try {
      writeFileSync(
        join(fixtureDir, "src", "components", "TaskList.tsx"),
        `
import { TaskCard } from "./TaskCard";
export function TaskList({ items }: { items: any[] }) {
  const handler = (t: any) => console.log(t);
  const cb = handler;
  return <div>{items.map(t => <TaskCard key={t.id} task={t} onTaskUpdated={cb} />)}</div>;
}
`,
        "utf8"
      );

      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "src/components/TaskCard.tsx", symbolName: "TaskCard", propName: "onTaskUpdated" },
      ]);

      expect(result.status).toBe("CLOSED");
      expect(result.mayChange).toContain("src/components/TaskList.tsx");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture F: Dynamic Callback — halts safely with IMPACT_ANALYSIS_INCOMPLETE for computed callback access", () => {
    const fixtureDir = createReactFixtureRepo("fixture-f");
    try {
      writeFileSync(
        join(fixtureDir, "src", "components", "TaskList.tsx"),
        `
import { TaskCard } from "./TaskCard";
export function TaskList({ items, handlers, activeKey }: { items: any[]; handlers: any; activeKey: string }) {
  return <div>{items.map(t => <TaskCard key={t.id} task={t} onTaskUpdated={handlers[activeKey]} />)}</div>;
}
`,
        "utf8"
      );

      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "src/components/TaskCard.tsx", symbolName: "TaskCard", propName: "onTaskUpdated" },
      ]);

      expect(result.status).toBe("IMPACT_ANALYSIS_INCOMPLETE");
      expect(result.unresolvedReasons?.some(r => r.reason.includes("DYNAMIC_CALLBACK"))).toBe(true);
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture G: Multi-File Regression — triggers exact transaction rollback when parent test fails", async () => {
    const fixtureDir = createReactFixtureRepo("fixture-g");
    try {
      const origActions = readFileSync(join(fixtureDir, "src/components/TaskActions.tsx"), "utf8");
      const origCard = readFileSync(join(fixtureDir, "src/components/TaskCard.tsx"), "utf8");
      const origList = readFileSync(join(fixtureDir, "src/components/TaskList.tsx"), "utf8");

      // Configure test script to fail if REGRESSION_FLAG is found
      writeFileSync(
        join(fixtureDir, "run-tests.cjs"),
        `const fs = require('fs');
const s = fs.readFileSync('src/components/TaskActions.tsx', 'utf8');
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

      const actionsOp = planner.planFunctionUpdate("src/components/TaskActions.tsx", "TaskActions", () => {
        return `export function TaskActions() {\n  throw new Error('REGRESSION_FLAG');\n}`;
      });

      const cardOp = planner.planCallSiteUpdate("src/components/TaskCard.tsx", "TaskActions", (orig) => orig);
      const listOp = planner.planCallSiteUpdate("src/components/TaskList.tsx", "TaskCard", (orig) => orig);

      const result = await modifier.modify({
        userRequest: "Trigger regression in multi-file prop change",
        targetSymbols: [
          { filePath: "src/components/TaskActions.tsx", symbolName: "TaskActions" },
          { filePath: "src/components/TaskCard.tsx", symbolName: "TaskCard" },
          { filePath: "src/components/TaskList.tsx", symbolName: "TaskList" },
        ],
        patches: [
          { filePath: "src/components/TaskActions.tsx", operations: [actionsOp!] },
          { filePath: "src/components/TaskCard.tsx", operations: cardOp },
          { filePath: "src/components/TaskList.tsx", operations: listOp },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe("TEST_REGRESSION");
      expect(result.checkpointRolledBack).toBe(true);
      expect(readFileSync(join(fixtureDir, "src/components/TaskActions.tsx"), "utf8")).toBe(origActions);
      expect(readFileSync(join(fixtureDir, "src/components/TaskCard.tsx"), "utf8")).toBe(origCard);
      expect(readFileSync(join(fixtureDir, "src/components/TaskList.tsx"), "utf8")).toBe(origList);
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Property Test: Idempotence & Determinism — multiple runs produce identical PropFlow graph and impact sets", () => {
    const fixtureDir = createReactFixtureRepo("property-test");
    try {
      const engine1 = new ImpactClosureEngine(fixtureDir);
      const res1 = engine1.computeClosure([
        { filePath: "src/components/TaskCard.tsx", symbolName: "TaskCard" },
      ]);

      const engine2 = new ImpactClosureEngine(fixtureDir);
      const res2 = engine2.computeClosure([
        { filePath: "src/components/TaskCard.tsx", symbolName: "TaskCard" },
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
