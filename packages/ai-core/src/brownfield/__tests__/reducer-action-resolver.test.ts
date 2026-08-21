import { describe, it, expect } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";
import { ReducerActionResolver } from "../reducer-action-resolver.js";

function createTempDir(prefix: string): string {
  const dir = join(tmpdir(), `aegis-reducer-resolver-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function safeCleanup(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {}
}

describe("ReducerActionResolver — Action Types, Reducer Branches, Action Creators & Safety Halts", () => {
  it("Discriminated Action Unions & Reducer Branches: extracts action literals, payload fields, and case statements", () => {
    const testDir = createTempDir("action-types-reducer");
    try {
      writeFileSync(
        join(testDir, "TaskActions.ts"),
        `
export type TaskAction =
  | { type: "ADD_TASK"; task: { id: string; title: string } }
  | { type: "UPDATE_TASK"; id: string; meta?: { urgent?: boolean } }
  | { type: "DELETE_TASK"; id: string };

export function updateTask(id: string, meta?: { urgent?: boolean }) {
  return { type: "UPDATE_TASK", id, meta };
}
`,
        "utf8"
      );

      writeFileSync(
        join(testDir, "taskReducer.ts"),
        `
import { TaskAction } from "./TaskActions";

export function taskReducer(state: any[], action: TaskAction) {
  switch (action.type) {
    case "ADD_TASK":
      return [...state, action.task];
    case "UPDATE_TASK":
      return state.map(t => t.id === action.id ? { ...t, ...action.meta } : t);
    case "DELETE_TASK":
      return state.filter(t => t.id !== action.id);
    default:
      return state;
  }
}
`,
        "utf8"
      );

      writeFileSync(
        join(testDir, "TaskComponent.tsx"),
        `
import { useReducer } from "react";
import { taskReducer } from "./taskReducer";
import { updateTask } from "./TaskActions";

export function TaskComponent() {
  const [tasks, dispatch] = useReducer(taskReducer, []);
  const handleDirect = (id: string) => dispatch({ type: "DELETE_TASK", id });
  const handleCreator = (id: string) => dispatch(updateTask(id, { urgent: true }));
  return <div>{tasks.length}</div>;
}
`,
        "utf8"
      );

      const symbolResolver = new SymbolReferenceResolver(testDir);
      symbolResolver.parseProject();

      const reducerResolver = new ReducerActionResolver(symbolResolver);
      const res = reducerResolver.analyzeProject();

      expect(res.actionTypes.length).toBe(3);
      expect(res.actionTypes.some(t => t.actionTypeLiteral === "UPDATE_TASK")).toBe(true);

      expect(res.actionCreators.length).toBe(1);
      expect(res.actionCreators[0].creatorName).toBe("updateTask");
      expect(res.actionCreators[0].actionTypeLiteral).toBe("UPDATE_TASK");

      expect(res.reducerBranches.length).toBe(3);
      const updateBranch = res.reducerBranches.find(b => b.actionTypeLiteral === "UPDATE_TASK");
      expect(updateBranch?.propertyReads).toContain("id");
      expect(updateBranch?.propertyReads).toContain("meta");

      expect(res.dispatchSites.length).toBe(2);
      expect(res.dispatchSites.some(d => d.actionTypeLiteral === "DELETE_TASK")).toBe(true);
      expect(res.dispatchSites.some(d => d.actionTypeLiteral === "UPDATE_TASK")).toBe(true);
    } finally {
      safeCleanup(testDir);
    }
  });

  it("Dynamic Action Type Safety: halts on dynamic variable dispatch({ type: actionType })", () => {
    const testDir = createTempDir("dynamic-action-type");
    try {
      writeFileSync(
        join(testDir, "DynamicDispatch.tsx"),
        `
export function DynamicDispatch({ dispatch, actionType }: { dispatch: any; actionType: string }) {
  const handleClick = () => dispatch({ type: actionType, id: "1" });
  return <button onClick={handleClick}>Click</button>;
}
`,
        "utf8"
      );

      const symbolResolver = new SymbolReferenceResolver(testDir);
      symbolResolver.parseProject();

      const reducerResolver = new ReducerActionResolver(symbolResolver);
      reducerResolver.analyzeProject();

      const trace = reducerResolver.findActionTrace("ANY_ACTION");
      expect(trace.hasDynamicAction).toBe(true);
      expect(trace.unsafeReasons[0]).toContain("DYNAMIC_ACTION_DISPATCH");
    } finally {
      safeCleanup(testDir);
    }
  });

  it("Dynamic Action Builder Safety: halts on unresolved dynamic builder dispatch(buildAction(input))", () => {
    const testDir = createTempDir("dynamic-builder");
    try {
      writeFileSync(
        join(testDir, "DynamicBuilder.tsx"),
        `
declare function buildAction(data: any): any;
export function DynamicBuilder({ dispatch }: { dispatch: any }) {
  const handleClick = (d: any) => dispatch(buildAction(d));
  return <button onClick={handleClick}>Click</button>;
}
`,
        "utf8"
      );

      const symbolResolver = new SymbolReferenceResolver(testDir);
      symbolResolver.parseProject();

      const reducerResolver = new ReducerActionResolver(symbolResolver);
      reducerResolver.analyzeProject();

      const trace = reducerResolver.findActionTrace("ANY_ACTION");
      expect(trace.hasDynamicAction).toBe(true);
      expect(trace.unsafeReasons[0]).toContain("DYNAMIC_ACTION_DISPATCH");
    } finally {
      safeCleanup(testDir);
    }
  });
});
