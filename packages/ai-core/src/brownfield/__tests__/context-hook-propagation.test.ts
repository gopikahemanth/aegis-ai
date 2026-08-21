import { describe, it, expect } from "vitest";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { ImpactClosureEngine } from "../impact-closure-engine.js";
import { ExistingSymbolModifier } from "../existing-symbol-modifier.js";
import { ASTSymbolPatchPlanner } from "../ast-symbol-patch-planner.js";

function createReactContextFixture(prefix: string): string {
  const dir = join(tmpdir(), `aegis-ctx-hook-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  mkdirSync(dir, { recursive: true });

  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify(
      {
        name: "react-ctx-app",
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

  mkdirSync(join(dir, "src", "context"), { recursive: true });
  mkdirSync(join(dir, "src", "hooks"), { recursive: true });
  mkdirSync(join(dir, "src", "components"), { recursive: true });
  mkdirSync(join(dir, "src", "__tests__"), { recursive: true });

  // 1. TaskContext.tsx
  writeFileSync(
    join(dir, "src", "context", "TaskContext.tsx"),
    `
import { createContext } from "react";
export interface TaskContextType {
  tasks: any[];
  loading: boolean;
  updateTask: (t: any) => void;
}
export const TaskContext = createContext<TaskContextType>({
  tasks: [],
  loading: false,
  updateTask: () => {},
});
`,
    "utf8"
  );

  // 2. TaskProvider.tsx
  writeFileSync(
    join(dir, "src", "context", "TaskProvider.tsx"),
    `
import { useState } from "react";
import { TaskContext } from "./TaskContext";

export function TaskProvider({ children }: { children: any }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const updateTask = (t: any) => setTasks(prev => [...prev, t]);

  return (
    <TaskContext.Provider value={{ tasks, loading, updateTask }}>
      {children}
    </TaskContext.Provider>
  );
}
`,
    "utf8"
  );

  // 3. Custom Hook useTaskActions.ts
  writeFileSync(
    join(dir, "src", "hooks", "useTaskActions.ts"),
    `
import { useContext } from "react";
import { TaskContext } from "../context/TaskContext";

export function useTaskActions() {
  const { updateTask } = useContext(TaskContext);
  return { updateTask };
}
`,
    "utf8"
  );

  // 4. Custom Hook useTasks.ts (Object return)
  writeFileSync(
    join(dir, "src", "hooks", "useTasks.ts"),
    `
import { useContext } from "react";
import { TaskContext } from "../context/TaskContext";

export function useTasks() {
  const { tasks, loading } = useContext(TaskContext);
  return { tasks, loading };
}
`,
    "utf8"
  );

  // 5. Custom Hook useToggle.ts (Tuple return)
  writeFileSync(
    join(dir, "src", "hooks", "useToggle.ts"),
    `
import { useState } from "react";
export function useToggle(initial = false) {
  const [open, setOpen] = useState(initial);
  const toggle = () => setOpen(!open);
  return [open, toggle] as const;
}
`,
    "utf8"
  );

  // 6. ConsumerA.tsx (Destructured)
  writeFileSync(
    join(dir, "src", "components", "ConsumerA.tsx"),
    `
import { useContext } from "react";
import { TaskContext } from "../context/TaskContext";

export function ConsumerA() {
  const { tasks } = useContext(TaskContext);
  return <div>{tasks.length}</div>;
}
`,
    "utf8"
  );

  // 7. ConsumerB.tsx (Object access)
  writeFileSync(
    join(dir, "src", "components", "ConsumerB.tsx"),
    `
import { useContext } from "react";
import { TaskContext } from "../context/TaskContext";

export function ConsumerB() {
  const ctx = useContext(TaskContext);
  return <div>{ctx.tasks.length}</div>;
}
`,
    "utf8"
  );

  // 8. ConsumerC.tsx (Hook consumer)
  writeFileSync(
    join(dir, "src", "components", "ConsumerC.tsx"),
    `
import { useTasks } from "../hooks/useTasks";

export function ConsumerC() {
  const { tasks, loading } = useTasks();
  return <div>{loading ? "Loading" : tasks.length}</div>;
}
`,
    "utf8"
  );

  // 9. ConsumerAction.tsx (Action invocation)
  writeFileSync(
    join(dir, "src", "components", "ConsumerAction.tsx"),
    `
import { useTaskActions } from "../hooks/useTaskActions";

export function ConsumerAction() {
  const { updateTask } = useTaskActions();
  return <button onClick={() => updateTask({ id: "1" })}>Update</button>;
}
`,
    "utf8"
  );

  // 10. Test
  writeFileSync(
    join(dir, "src", "__tests__", "ConsumerA.test.tsx"),
    `
import { ConsumerA } from "../components/ConsumerA";
describe("ConsumerA", () => {
  it("renders", () => {
    expect(ConsumerA).toBeDefined();
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

describe("Context & Custom Hook Propagation — Fixtures A through K", () => {
  it("Fixture A: Context Provider + 3 Consumers — discovers provider and all consumer files in closed impact set", () => {
    const fixtureDir = createReactContextFixture("fixture-a");
    try {
      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "src/context/TaskContext.tsx", symbolName: "TaskContext", contextName: "TaskContext" },
      ]);

      expect(result.status).toBe("CLOSED");
      expect(result.mustChange).toContain("src/context/TaskContext.tsx");
      expect(result.mayChange).toContain("src/context/TaskProvider.tsx");
      expect(result.mayChange).toContain("src/components/ConsumerA.tsx");
      expect(result.mayChange).toContain("src/components/ConsumerB.tsx");
      expect(result.mayChange).toContain("src/hooks/useTasks.ts");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture B: Context Property Rename — modifies loading to isLoading across provider and hook consumers", async () => {
    const fixtureDir = createReactContextFixture("fixture-b");
    try {
      const modifier = new ExistingSymbolModifier(fixtureDir);
      const planner = new ASTSymbolPatchPlanner(fixtureDir);

      const ctxOp = planner.planFunctionUpdate("src/context/TaskContext.tsx", "TaskContext", () => {
        return `export interface TaskContextType {\n  tasks: any[];\n  isLoading: boolean;\n  updateTask: (t: any) => void;\n}\nexport const TaskContext = createContext<TaskContextType>({\n  tasks: [],\n  isLoading: false,\n  updateTask: () => {},\n});`;
      });

      const provOp = planner.planFunctionUpdate("src/context/TaskProvider.tsx", "TaskProvider", () => {
        return `export function TaskProvider({ children }: { children: any }) {\n  const [tasks, setTasks] = useState<any[]>([]);\n  const [isLoading, setIsLoading] = useState(false);\n  const updateTask = (t: any) => setTasks(prev => [...prev, t]);\n\n  return (\n    <TaskContext.Provider value={{ tasks, isLoading, updateTask }}>\n      {children}\n    </TaskContext.Provider>\n  );\n}`;
      });

      const hookOp = planner.planFunctionUpdate("src/hooks/useTasks.ts", "useTasks", () => {
        return `export function useTasks() {\n  const { tasks, isLoading } = useContext(TaskContext);\n  return { tasks, isLoading };\n}`;
      });

      const compOp = planner.planFunctionUpdate("src/components/ConsumerC.tsx", "ConsumerC", () => {
        return `export function ConsumerC() {\n  const { tasks, isLoading } = useTasks();\n  return <div>{isLoading ? "Loading" : tasks.length}</div>;\n}`;
      });

      const result = await modifier.modify({
        userRequest: "Rename loading to isLoading in TaskContext",
        targetSymbols: [
          { filePath: "src/context/TaskContext.tsx", symbolName: "TaskContext", contextName: "TaskContext", propName: "loading" },
          { filePath: "src/context/TaskProvider.tsx", symbolName: "TaskProvider" },
          { filePath: "src/hooks/useTasks.ts", symbolName: "useTasks", hookName: "useTasks", propName: "loading" },
          { filePath: "src/components/ConsumerC.tsx", symbolName: "ConsumerC" },
        ],
        patches: [
          { filePath: "src/context/TaskContext.tsx", operations: [ctxOp!] },
          { filePath: "src/context/TaskProvider.tsx", operations: [provOp!] },
          { filePath: "src/hooks/useTasks.ts", operations: [hookOp!] },
          { filePath: "src/components/ConsumerC.tsx", operations: [compOp!] },
        ],
      });

      expect(result.success).toBe(true);
      expect(readFileSync(join(fixtureDir, "src/context/TaskContext.tsx"), "utf8")).toContain("isLoading: boolean");
      expect(readFileSync(join(fixtureDir, "src/components/ConsumerC.tsx"), "utf8")).toContain("isLoading ?");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture C: Context Alias — resolves direct property access on context object", () => {
    const fixtureDir = createReactContextFixture("fixture-c");
    try {
      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "src/context/TaskContext.tsx", symbolName: "TaskContext", propName: "tasks" },
      ]);

      expect(result.status).toBe("CLOSED");
      expect(result.mayChange).toContain("src/components/ConsumerB.tsx");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture D: Computed Context Key — halts with IMPACT_ANALYSIS_INCOMPLETE for ctx[activeKey]", () => {
    const fixtureDir = createReactContextFixture("fixture-d");
    try {
      writeFileSync(
        join(fixtureDir, "src", "components", "ConsumerDynamic.tsx"),
        `
import { useContext } from "react";
import { TaskContext } from "../context/TaskContext";
export function ConsumerDynamic({ keyName }: { keyName: string }) {
  const ctx = useContext(TaskContext);
  return <div>{ctx[keyName]}</div>;
}
`,
        "utf8"
      );

      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "src/context/TaskContext.tsx", symbolName: "TaskContext", contextName: "TaskContext" },
      ]);

      expect(result.status).toBe("IMPACT_ANALYSIS_INCOMPLETE");
      expect(result.unresolvedReasons?.some(r => r.reason.includes("COMPUTED_CONTEXT_ACCESS"))).toBe(true);
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture E: Hook Object Return — resolves hook return object and consuming components", () => {
    const fixtureDir = createReactContextFixture("fixture-e");
    try {
      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "src/hooks/useTasks.ts", symbolName: "useTasks", hookName: "useTasks" },
      ]);

      expect(result.status).toBe("CLOSED");
      expect(result.mayChange).toContain("src/components/ConsumerC.tsx");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture F: Hook Aliased Return — resolves aliased destructuring const { tasks: currentTasks }", () => {
    const fixtureDir = createReactContextFixture("fixture-f");
    try {
      writeFileSync(
        join(fixtureDir, "src", "components", "ConsumerAliasedHook.tsx"),
        `
import { useTasks } from "../hooks/useTasks";
export function ConsumerAliasedHook() {
  const { tasks: currentTasks } = useTasks();
  return <div>{currentTasks.length}</div>;
}
`,
        "utf8"
      );

      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "src/hooks/useTasks.ts", symbolName: "useTasks", hookName: "useTasks" },
      ]);

      expect(result.status).toBe("CLOSED");
      expect(result.mayChange).toContain("src/components/ConsumerAliasedHook.tsx");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture G: Hook Tuple Return — resolves tuple positional destructuring const [isOpen, toggle]", () => {
    const fixtureDir = createReactContextFixture("fixture-g");
    try {
      writeFileSync(
        join(fixtureDir, "src", "components", "ModalToggle.tsx"),
        `
import { useToggle } from "../hooks/useToggle";
export function ModalToggle() {
  const [isOpen, toggle] = useToggle();
  return <button onClick={toggle}>{isOpen ? "Close" : "Open"}</button>;
}
`,
        "utf8"
      );

      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "src/hooks/useToggle.ts", symbolName: "useToggle", hookName: "useToggle" },
      ]);

      expect(result.status).toBe("CLOSED");
      expect(result.mayChange).toContain("src/components/ModalToggle.tsx");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture H: Hook Callback — traces updateTask callback returned by useTaskActions to UI button caller", () => {
    const fixtureDir = createReactContextFixture("fixture-h");
    try {
      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "src/hooks/useTaskActions.ts", symbolName: "useTaskActions", hookName: "useTaskActions" },
      ]);

      expect(result.status).toBe("CLOSED");
      expect(result.mayChange).toContain("src/components/ConsumerAction.tsx");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture I: Hook Property Rename — identifies all consumers when returned property name changes", () => {
    const fixtureDir = createReactContextFixture("fixture-i");
    try {
      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "src/hooks/useTasks.ts", symbolName: "useTasks", propName: "loading" },
      ]);

      expect(result.status).toBe("CLOSED");
      expect(result.mayChange).toContain("src/components/ConsumerC.tsx");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture J: Multi-File Regression — triggers exact transaction rollback on multi-file context/hook change", async () => {
    const fixtureDir = createReactContextFixture("fixture-j");
    try {
      const origCtx = readFileSync(join(fixtureDir, "src/context/TaskContext.tsx"), "utf8");
      const origHook = readFileSync(join(fixtureDir, "src/hooks/useTasks.ts"), "utf8");

      // Set test script to fail on REGRESSION_FLAG
      writeFileSync(
        join(fixtureDir, "run-tests.cjs"),
        `const fs = require('fs');
const s = fs.readFileSync('src/context/TaskContext.tsx', 'utf8');
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

      const ctxOp = planner.planFunctionUpdate("src/context/TaskContext.tsx", "TaskContext", () => {
        return `export const TaskContext = createContext<any>({\n  error: 'REGRESSION_FLAG'\n});`;
      });

      const provOp = planner.planFunctionUpdate("src/context/TaskProvider.tsx", "TaskProvider", (orig) => orig);
      const hookOp = planner.planCallSiteUpdate("src/hooks/useTasks.ts", "useContext", (orig) => orig);
      const compOp = planner.planCallSiteUpdate("src/components/ConsumerC.tsx", "useTasks", (orig) => orig);

      const result = await modifier.modify({
        userRequest: "Trigger regression in context/hook",
        targetSymbols: [
          { filePath: "src/context/TaskContext.tsx", symbolName: "TaskContext", contextName: "TaskContext", propName: "loading" },
          { filePath: "src/context/TaskProvider.tsx", symbolName: "TaskProvider" },
          { filePath: "src/hooks/useTasks.ts", symbolName: "useTasks", hookName: "useTasks", propName: "loading" },
          { filePath: "src/components/ConsumerC.tsx", symbolName: "ConsumerC" },
        ],
        patches: [
          { filePath: "src/context/TaskContext.tsx", operations: [ctxOp!] },
          { filePath: "src/context/TaskProvider.tsx", operations: [provOp!] },
          { filePath: "src/hooks/useTasks.ts", operations: hookOp },
          { filePath: "src/components/ConsumerC.tsx", operations: compOp },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe("TEST_REGRESSION");
      expect(result.checkpointRolledBack).toBe(true);
      expect(readFileSync(join(fixtureDir, "src/context/TaskContext.tsx"), "utf8")).toBe(origCtx);
      expect(readFileSync(join(fixtureDir, "src/hooks/useTasks.ts"), "utf8")).toBe(origHook);
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture K: Dynamic Hook Value — halts with IMPACT_ANALYSIS_INCOMPLETE for result[dynamicKey]", () => {
    const fixtureDir = createReactContextFixture("fixture-k");
    try {
      writeFileSync(
        join(fixtureDir, "src", "components", "DynamicHookConsumer.tsx"),
        `
import { useTasks } from "../hooks/useTasks";
export function DynamicHookConsumer({ field }: { field: string }) {
  const result = useTasks();
  return <div>{result[field]}</div>;
}
`,
        "utf8"
      );

      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "src/hooks/useTasks.ts", symbolName: "useTasks", hookName: "useTasks" },
      ]);

      expect(result.status).toBe("IMPACT_ANALYSIS_INCOMPLETE");
      expect(result.unresolvedReasons?.some(r => r.reason.includes("DYNAMIC_HOOK_PROPERTY_ACCESS"))).toBe(true);
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Property Test: Idempotence & Determinism — consecutive runs produce strictly identical Context/Hook impact sets", () => {
    const fixtureDir = createReactContextFixture("property-test");
    try {
      const engine1 = new ImpactClosureEngine(fixtureDir);
      const res1 = engine1.computeClosure([
        { filePath: "src/context/TaskContext.tsx", symbolName: "TaskContext", contextName: "TaskContext" },
      ]);

      const engine2 = new ImpactClosureEngine(fixtureDir);
      const res2 = engine2.computeClosure([
        { filePath: "src/context/TaskContext.tsx", symbolName: "TaskContext", contextName: "TaskContext" },
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
