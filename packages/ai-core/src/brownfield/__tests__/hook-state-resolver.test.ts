import { describe, it, expect } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";
import { HookStateResolver } from "../hook-state-resolver.js";

function createTempDir(prefix: string): string {
  const dir = join(tmpdir(), `aegis-hook-resolver-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function safeCleanup(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {}
}

describe("HookStateResolver — Custom Hook Return Shapes, Tuple & Property Access", () => {
  it("Object Return: extracts returned object properties and consumer destructuring", () => {
    const testDir = createTempDir("hook-object");
    try {
      writeFileSync(
        join(testDir, "useTasks.ts"),
        `
export function useTasks() {
  const tasks = [{ id: "1", title: "Test" }];
  const loading = false;
  const updateTask = (t: any) => {};
  return { tasks, loading, updateTask };
}
`,
        "utf8"
      );

      writeFileSync(
        join(testDir, "TaskDashboard.tsx"),
        `
import { useTasks } from "./useTasks";
export function TaskDashboard() {
  const { tasks, loading } = useTasks();
  return <div>{loading ? "Loading" : tasks.length}</div>;
}
`,
        "utf8"
      );

      const symbolResolver = new SymbolReferenceResolver(testDir);
      symbolResolver.parseProject();

      const hookResolver = new HookStateResolver(symbolResolver);
      const res = hookResolver.analyzeProject();

      expect(res.definitions.length).toBe(1);
      expect(res.definitions[0].hookName).toBe("useTasks");
      expect(res.definitions[0].returnKind).toBe("OBJECT");
      expect(res.definitions[0].returnedProperties).toContain("tasks");
      expect(res.definitions[0].returnedProperties).toContain("loading");
      expect(res.definitions[0].returnedProperties).toContain("updateTask");

      expect(res.consumers.length).toBe(1);
      expect(res.consumers[0].destructuredProperties).toContain("tasks");
      expect(res.consumers[0].destructuredProperties).toContain("loading");
    } finally {
      safeCleanup(testDir);
    }
  });

  it("Tuple Return: extracts returned tuple elements and positional consumer destructuring", () => {
    const testDir = createTempDir("hook-tuple");
    try {
      writeFileSync(
        join(testDir, "useToggle.ts"),
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

      writeFileSync(
        join(testDir, "Modal.tsx"),
        `
import { useToggle } from "./useToggle";
export function Modal() {
  const [isOpen, toggleOpen] = useToggle();
  return <button onClick={toggleOpen}>{isOpen ? "Close" : "Open"}</button>;
}
`,
        "utf8"
      );

      const symbolResolver = new SymbolReferenceResolver(testDir);
      symbolResolver.parseProject();

      const hookResolver = new HookStateResolver(symbolResolver);
      const res = hookResolver.analyzeProject();

      expect(res.definitions.length).toBe(1);
      expect(res.definitions[0].hookName).toBe("useToggle");
      expect(res.definitions[0].returnKind).toBe("TUPLE");

      expect(res.consumers.length).toBe(1);
      expect(res.consumers[0].destructuredTupleIndices).toContain(0);
      expect(res.consumers[0].destructuredTupleIndices).toContain(1);
    } finally {
      safeCleanup(testDir);
    }
  });

  it("Dynamic Hook Property Access Safety: halts on dynamic computed key result[key]", () => {
    const testDir = createTempDir("dynamic-hook");
    try {
      writeFileSync(
        join(testDir, "useTasks.ts"),
        `
export function useTasks() {
  return { tasks: [], count: 0 };
}
`,
        "utf8"
      );

      writeFileSync(
        join(testDir, "DynamicConsumer.tsx"),
        `
import { useTasks } from "./useTasks";
export function DynamicConsumer({ keyName }: { keyName: string }) {
  const state = useTasks();
  const val = state[keyName];
  return <div>{val}</div>;
}
`,
        "utf8"
      );

      const symbolResolver = new SymbolReferenceResolver(testDir);
      symbolResolver.parseProject();

      const hookResolver = new HookStateResolver(symbolResolver);
      hookResolver.analyzeProject();

      const trace = hookResolver.findHookTrace("useTasks");
      expect(trace.hasDynamicAccess).toBe(true);
      expect(trace.unsafeReasons[0]).toContain("DYNAMIC_HOOK_PROPERTY_ACCESS");
    } finally {
      safeCleanup(testDir);
    }
  });
});
