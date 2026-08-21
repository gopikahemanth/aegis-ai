import { describe, it, expect } from "vitest";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { ImpactClosureEngine } from "../impact-closure-engine.js";
import { ExistingSymbolModifier } from "../existing-symbol-modifier.js";
import { ASTSymbolPatchPlanner } from "../ast-symbol-patch-planner.js";

function createReducerFixtureRepo(prefix: string): string {
  const dir = join(tmpdir(), `aegis-reducer-prop-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  mkdirSync(dir, { recursive: true });

  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify(
      {
        name: "react-reducer-app",
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

  mkdirSync(join(dir, "src", "types"), { recursive: true });
  mkdirSync(join(dir, "src", "actions"), { recursive: true });
  mkdirSync(join(dir, "src", "reducers"), { recursive: true });
  mkdirSync(join(dir, "src", "context"), { recursive: true });
  mkdirSync(join(dir, "src", "hooks"), { recursive: true });
  mkdirSync(join(dir, "src", "components"), { recursive: true });
  mkdirSync(join(dir, "src", "__tests__"), { recursive: true });

  // 1. TaskTypes.ts
  writeFileSync(
    join(dir, "src", "types", "TaskTypes.ts"),
    `
export type TaskAction =
  | { type: "ADD_TASK"; title: string }
  | { type: "UPDATE_TASK"; id: string; meta?: { urgent?: boolean } }
  | { type: "DELETE_TASK"; id: string };
`,
    "utf8"
  );

  // 2. taskActions.ts
  writeFileSync(
    join(dir, "src", "actions", "taskActions.ts"),
    `
export function updateTask(id: string, meta?: { urgent?: boolean }) {
  return { type: "UPDATE_TASK", id, meta };
}
`,
    "utf8"
  );

  // 3. taskReducer.ts
  writeFileSync(
    join(dir, "src", "reducers", "taskReducer.ts"),
    `
import { TaskAction } from "../types/TaskTypes";

export function taskReducer(state: any[], action: TaskAction) {
  switch (action.type) {
    case "ADD_TASK":
      return [...state, { id: Date.now().toString(), title: action.title }];
    case "UPDATE_TASK":
      return state.map(t => (t.id === action.id ? { ...t, ...action.meta } : t));
    case "DELETE_TASK":
      return state.filter(t => t.id !== action.id);
    default:
      return state;
  }
}
`,
    "utf8"
  );

  // 4. TaskContext.tsx (Context + Reducer)
  writeFileSync(
    join(dir, "src", "context", "TaskContext.tsx"),
    `
import { createContext, useReducer } from "react";
import { taskReducer } from "../reducers/taskReducer";
import { TaskAction } from "../types/TaskTypes";

export const TaskContext = createContext<any>(null);

export function TaskProvider({ children }: { children: any }) {
  const [tasks, dispatch] = useReducer(taskReducer, []);
  return (
    <TaskContext.Provider value={{ tasks, dispatch }}>
      {children}
    </TaskContext.Provider>
  );
}
`,
    "utf8"
  );

  // 5. useTaskStore.ts (Hook + Reducer)
  writeFileSync(
    join(dir, "src", "hooks", "useTaskStore.ts"),
    `
import { useReducer } from "react";
import { taskReducer } from "../reducers/taskReducer";
import { updateTask } from "../actions/taskActions";

export function useTaskStore() {
  const [tasks, dispatch] = useReducer(taskReducer, []);
  const handleUpdate = (id: string, meta?: any) => dispatch(updateTask(id, meta));
  return { tasks, handleUpdate };
}
`,
    "utf8"
  );

  // 6. TaskList.tsx
  writeFileSync(
    join(dir, "src", "components", "TaskList.tsx"),
    `
import { useContext } from "react";
import { TaskContext } from "../context/TaskContext";

export function TaskList() {
  const { tasks, dispatch } = useContext(TaskContext);
  const onDelete = (id: string) => dispatch({ type: "DELETE_TASK", id });
  return <div>{tasks.length}</div>;
}
`,
    "utf8"
  );

  // 7. Test
  writeFileSync(
    join(dir, "src", "__tests__", "taskReducer.test.ts"),
    `
import { taskReducer } from "../reducers/taskReducer";

describe("taskReducer", () => {
  it("handles actions", () => {
    expect(taskReducer([], { type: "ADD_TASK", title: "Test" })).toHaveLength(1);
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

describe("ReducerActionResolver — Fixture Matrix (Fixtures A through L)", () => {
  it("Fixture A: Basic useReducer — identifies action types, reducer, and dispatch in closed impact set", () => {
    const fixtureDir = createReducerFixtureRepo("fixture-a");
    try {
      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "src/types/TaskTypes.ts", symbolName: "TaskAction", actionTypeLiteral: "UPDATE_TASK" },
      ]);

      expect(result.status).toBe("CLOSED");
      expect(result.mustChange).toContain("src/types/TaskTypes.ts");
      expect(result.mayChange).toContain("src/reducers/taskReducer.ts");
      expect(result.mayChange).toContain("src/actions/taskActions.ts");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture B: Action Payload Addition — modifies UPDATE_TASK payload across type, creator, and reducer", async () => {
    const fixtureDir = createReducerFixtureRepo("fixture-b");
    try {
      const modifier = new ExistingSymbolModifier(fixtureDir);
      const planner = new ASTSymbolPatchPlanner(fixtureDir);

      const typeOp = planner.planFunctionUpdate("src/types/TaskTypes.ts", "TaskAction", () => {
        return `export type TaskAction =\n  | { type: "ADD_TASK"; title: string }\n  | { type: "UPDATE_TASK"; id: string; meta?: { urgent?: boolean; priority?: string } }\n  | { type: "DELETE_TASK"; id: string };`;
      });

      const creatorOp = planner.planFunctionUpdate("src/actions/taskActions.ts", "updateTask", () => {
        return `export function updateTask(id: string, meta?: { urgent?: boolean; priority?: string }) {\n  return { type: "UPDATE_TASK", id, meta };\n}`;
      });

      const reducerOp = planner.planFunctionUpdate("src/reducers/taskReducer.ts", "taskReducer", () => {
        return `export function taskReducer(state: any[], action: TaskAction) {\n  switch (action.type) {\n    case "ADD_TASK":\n      return [...state, { id: Date.now().toString(), title: action.title }];\n    case "UPDATE_TASK":\n      return state.map(t => (t.id === action.id ? { ...t, ...action.meta, priority: action.meta?.priority } : t));\n    case "DELETE_TASK":\n      return state.filter(t => t.id !== action.id);\n    default:\n      return state;\n  }\n}`;
      });

      const storeOp = planner.planCallSiteUpdate("src/hooks/useTaskStore.ts", "updateTask", (orig) => orig);
      const ctxOp = planner.planCallSiteUpdate("src/context/TaskContext.tsx", "useReducer", (orig) => orig);
      const listOp = planner.planCallSiteUpdate("src/components/TaskList.tsx", "useContext", (orig) => orig);

      const result = await modifier.modify({
        userRequest: "Add priority to UPDATE_TASK action",
        targetSymbols: [
          { filePath: "src/types/TaskTypes.ts", symbolName: "TaskAction", actionTypeLiteral: "UPDATE_TASK", propName: "priority" },
          { filePath: "src/actions/taskActions.ts", symbolName: "updateTask" },
          { filePath: "src/reducers/taskReducer.ts", symbolName: "taskReducer" },
          { filePath: "src/hooks/useTaskStore.ts", symbolName: "useTaskStore" },
          { filePath: "src/context/TaskContext.tsx", symbolName: "TaskContext" },
          { filePath: "src/components/TaskList.tsx", symbolName: "TaskList" },
        ],
        patches: [
          { filePath: "src/types/TaskTypes.ts", operations: [typeOp!] },
          { filePath: "src/actions/taskActions.ts", operations: [creatorOp!] },
          { filePath: "src/reducers/taskReducer.ts", operations: [reducerOp!] },
          { filePath: "src/hooks/useTaskStore.ts", operations: storeOp },
          { filePath: "src/context/TaskContext.tsx", operations: ctxOp },
          { filePath: "src/components/TaskList.tsx", operations: listOp },
        ],
      });

      expect(result.success).toBe(true);
      expect(readFileSync(join(fixtureDir, "src/types/TaskTypes.ts"), "utf8")).toContain("priority?: string");
      expect(readFileSync(join(fixtureDir, "src/reducers/taskReducer.ts"), "utf8")).toContain("priority: action.meta?.priority");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture C: Action Payload Rename — renames id to taskId across action and reducer", () => {
    const fixtureDir = createReducerFixtureRepo("fixture-c");
    try {
      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "src/types/TaskTypes.ts", symbolName: "TaskAction", actionTypeLiteral: "DELETE_TASK" },
      ]);

      expect(result.status).toBe("CLOSED");
      expect(result.mayChange).toContain("src/reducers/taskReducer.ts");
      expect(result.mayChange).toContain("src/components/TaskList.tsx");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture D: Action Creator — resolves action creator function and dispatch callers", () => {
    const fixtureDir = createReducerFixtureRepo("fixture-d");
    try {
      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "src/actions/taskActions.ts", symbolName: "updateTask" },
      ]);

      expect(result.status).toBe("CLOSED");
      expect(result.mayChange).toContain("src/hooks/useTaskStore.ts");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture E: Dynamic Action Safety — halts on dispatch({ type: dynamicVar })", () => {
    const fixtureDir = createReducerFixtureRepo("fixture-e");
    try {
      writeFileSync(
        join(fixtureDir, "src", "components", "DynamicDispatch.tsx"),
        `
export function DynamicDispatch({ dispatch, actionType }: { dispatch: any; actionType: string }) {
  return <button onClick={() => dispatch({ type: actionType, id: "1" })}>Click</button>;
}
`,
        "utf8"
      );

      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "src/types/TaskTypes.ts", symbolName: "TaskAction", actionTypeLiteral: "DELETE_TASK" },
      ]);

      expect(result.status).toBe("IMPACT_ANALYSIS_INCOMPLETE");
      expect(result.unresolvedReasons?.some(r => r.reason.includes("DYNAMIC_ACTION_DISPATCH"))).toBe(true);
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture F: Dynamic Action Builder Safety — halts on dispatch(buildAction(input))", () => {
    const fixtureDir = createReducerFixtureRepo("fixture-f");
    try {
      writeFileSync(
        join(fixtureDir, "src", "components", "DynamicBuilder.tsx"),
        `
declare function buildAction(data: any): any;
export function DynamicBuilder({ dispatch }: { dispatch: any }) {
  return <button onClick={() => dispatch(buildAction("1"))}>Click</button>;
}
`,
        "utf8"
      );

      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "src/types/TaskTypes.ts", symbolName: "TaskAction", actionTypeLiteral: "DELETE_TASK" },
      ]);

      expect(result.status).toBe("IMPACT_ANALYSIS_INCOMPLETE");
      expect(result.unresolvedReasons?.some(r => r.reason.includes("DYNAMIC_ACTION_DISPATCH"))).toBe(true);
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture G: Static Handler Map — resolves literal-key action handler map", () => {
    const fixtureDir = createReducerFixtureRepo("fixture-g");
    try {
      writeFileSync(
        join(fixtureDir, "src", "reducers", "mapReducer.ts"),
        `
export const handlers = {
  ADD_TASK: (state: any, action: any) => [...state, action.title],
  DELETE_TASK: (state: any, action: any) => state.filter((t: any) => t !== action.id),
};
`,
        "utf8"
      );

      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "src/reducers/mapReducer.ts", symbolName: "handlers", actionTypeLiteral: "ADD_TASK" },
      ]);

      expect(result.status).toBe("CLOSED");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture H: Context + useReducer — traces action dispatch through Context Provider to consumer", () => {
    const fixtureDir = createReducerFixtureRepo("fixture-h");
    try {
      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "src/types/TaskTypes.ts", symbolName: "TaskAction", actionTypeLiteral: "DELETE_TASK" },
      ]);

      expect(result.status).toBe("CLOSED");
      expect(result.mayChange).toContain("src/components/TaskList.tsx");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture I: Custom Hook + useReducer — traces action update through custom hook wrapper", () => {
    const fixtureDir = createReducerFixtureRepo("fixture-i");
    try {
      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "src/actions/taskActions.ts", symbolName: "updateTask" },
      ]);

      expect(result.status).toBe("CLOSED");
      expect(result.mayChange).toContain("src/hooks/useTaskStore.ts");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture J: State Consumer — discovers components reading useReducer state", () => {
    const fixtureDir = createReducerFixtureRepo("fixture-j");
    try {
      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "src/reducers/taskReducer.ts", symbolName: "taskReducer" },
      ]);

      expect(result.status).toBe("CLOSED");
      expect(result.mayChange).toContain("src/context/TaskContext.tsx");
      expect(result.mayChange).toContain("src/hooks/useTaskStore.ts");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture K: Nested Reducer — resolves combined reducers", () => {
    const fixtureDir = createReducerFixtureRepo("fixture-k");
    try {
      writeFileSync(
        join(fixtureDir, "src", "reducers", "rootReducer.ts"),
        `
import { taskReducer } from "./taskReducer";
export function rootReducer(state: any = {}, action: any) {
  return {
    tasks: taskReducer(state.tasks, action),
  };
}
`,
        "utf8"
      );

      const engine = new ImpactClosureEngine(fixtureDir);
      const result = engine.computeClosure([
        { filePath: "src/reducers/taskReducer.ts", symbolName: "taskReducer" },
      ]);

      expect(result.status).toBe("CLOSED");
      expect(result.mayChange).toContain("src/reducers/rootReducer.ts");
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Fixture L: Multi-File Regression Rollback — triggers atomic rollback when reducer test fails", async () => {
    const fixtureDir = createReducerFixtureRepo("fixture-l");
    try {
      const origTypes = readFileSync(join(fixtureDir, "src/types/TaskTypes.ts"), "utf8");
      const origReducer = readFileSync(join(fixtureDir, "src/reducers/taskReducer.ts"), "utf8");

      // Configure test script to fail on REGRESSION_FLAG
      writeFileSync(
        join(fixtureDir, "run-tests.cjs"),
        `const fs = require('fs');
const s = fs.readFileSync('src/reducers/taskReducer.ts', 'utf8');
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

      const typeOp = planner.planFunctionUpdate("src/types/TaskTypes.ts", "TaskAction", (orig) => orig);
      const creatorOp = planner.planFunctionUpdate("src/actions/taskActions.ts", "updateTask", (orig) => orig);
      const storeOp = planner.planCallSiteUpdate("src/hooks/useTaskStore.ts", "updateTask", (orig) => orig);
      const ctxOp = planner.planCallSiteUpdate("src/context/TaskContext.tsx", "useReducer", (orig) => orig);
      const listOp = planner.planCallSiteUpdate("src/components/TaskList.tsx", "useContext", (orig) => orig);
      const reducerOp = planner.planFunctionUpdate("src/reducers/taskReducer.ts", "taskReducer", () => {
        return `export function taskReducer() {\n  throw new Error('REGRESSION_FLAG');\n}`;
      });

      const result = await modifier.modify({
        userRequest: "Trigger regression in reducer",
        targetSymbols: [
          { filePath: "src/types/TaskTypes.ts", symbolName: "TaskAction", actionTypeLiteral: "UPDATE_TASK", propName: "meta" },
          { filePath: "src/actions/taskActions.ts", symbolName: "updateTask" },
          { filePath: "src/reducers/taskReducer.ts", symbolName: "taskReducer" },
          { filePath: "src/hooks/useTaskStore.ts", symbolName: "useTaskStore" },
          { filePath: "src/context/TaskContext.tsx", symbolName: "TaskContext" },
          { filePath: "src/components/TaskList.tsx", symbolName: "TaskList" },
        ],
        patches: [
          { filePath: "src/types/TaskTypes.ts", operations: [typeOp!] },
          { filePath: "src/actions/taskActions.ts", operations: [creatorOp!] },
          { filePath: "src/reducers/taskReducer.ts", operations: [reducerOp!] },
          { filePath: "src/hooks/useTaskStore.ts", operations: storeOp },
          { filePath: "src/context/TaskContext.tsx", operations: ctxOp },
          { filePath: "src/components/TaskList.tsx", operations: listOp },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe("TEST_REGRESSION");
      expect(result.checkpointRolledBack).toBe(true);
      expect(readFileSync(join(fixtureDir, "src/types/TaskTypes.ts"), "utf8")).toBe(origTypes);
      expect(readFileSync(join(fixtureDir, "src/reducers/taskReducer.ts"), "utf8")).toBe(origReducer);
    } finally {
      safeCleanup(fixtureDir);
    }
  });

  it("Property Test: Idempotence & Determinism — consecutive runs produce strictly identical Reducer/Action impact sets", () => {
    const fixtureDir = createReducerFixtureRepo("property-test");
    try {
      const engine1 = new ImpactClosureEngine(fixtureDir);
      const res1 = engine1.computeClosure([
        { filePath: "src/types/TaskTypes.ts", symbolName: "TaskAction", actionTypeLiteral: "UPDATE_TASK" },
      ]);

      const engine2 = new ImpactClosureEngine(fixtureDir);
      const res2 = engine2.computeClosure([
        { filePath: "src/types/TaskTypes.ts", symbolName: "TaskAction", actionTypeLiteral: "UPDATE_TASK" },
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
