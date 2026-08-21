import { describe, it, expect } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";
import { ContextUsageResolver } from "../context-usage-resolver.js";

function createTempDir(prefix: string): string {
  const dir = join(tmpdir(), `aegis-ctx-resolver-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function safeCleanup(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {}
}

describe("ContextUsageResolver — Definitions, Providers, Consumers & Safety Halts", () => {
  it("Context Definitions & Provider Value: extracts createContext defaults and Provider value properties", () => {
    const testDir = createTempDir("context-def-provider");
    try {
      writeFileSync(
        join(testDir, "TaskContext.tsx"),
        `
import { createContext } from "react";
export interface TaskContextType { tasks: any[]; updateTask: (t: any) => void; }
export const TaskContext = createContext<TaskContextType>({ tasks: [], updateTask: () => {} });
`,
        "utf8"
      );

      writeFileSync(
        join(testDir, "TaskProvider.tsx"),
        `
import { useState } from "react";
import { TaskContext } from "./TaskContext";
export function TaskProvider({ children }: { children: any }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const updateTask = (t: any) => {};
  return (
    <TaskContext.Provider value={{ tasks, updateTask }}>
      {children}
    </TaskContext.Provider>
  );
}
`,
        "utf8"
      );

      const symbolResolver = new SymbolReferenceResolver(testDir);
      symbolResolver.parseProject();

      const ctxResolver = new ContextUsageResolver(symbolResolver);
      const res = ctxResolver.analyzeProject();

      expect(res.definitions.length).toBe(1);
      expect(res.definitions[0].contextName).toBe("TaskContext");
      expect(res.definitions[0].defaultProperties).toContain("tasks");
      expect(res.definitions[0].defaultProperties).toContain("updateTask");

      expect(res.providers.length).toBe(1);
      expect(res.providers[0].contextName).toBe("TaskContext");
      expect(res.providers[0].suppliedProperties).toContain("tasks");
      expect(res.providers[0].suppliedProperties).toContain("updateTask");
    } finally {
      safeCleanup(testDir);
    }
  });

  it("useContext Consumers: resolves destructured, direct object, and aliased consumers", () => {
    const testDir = createTempDir("context-consumers");
    try {
      writeFileSync(
        join(testDir, "TaskContext.tsx"),
        `
import { createContext } from "react";
export const TaskContext = createContext<any>(null);
`,
        "utf8"
      );

      writeFileSync(
        join(testDir, "ConsumerDestructured.tsx"),
        `
import { useContext } from "react";
import { TaskContext } from "./TaskContext";
export function ConsumerDestructured() {
  const { tasks, updateTask } = useContext(TaskContext);
  return <div>{tasks.length}</div>;
}
`,
        "utf8"
      );

      writeFileSync(
        join(testDir, "ConsumerObject.tsx"),
        `
import { useContext } from "react";
import { TaskContext } from "./TaskContext";
export function ConsumerObject() {
  const ctx = useContext(TaskContext);
  return <div>{ctx.tasks.length}</div>;
}
`,
        "utf8"
      );

      writeFileSync(
        join(testDir, "ConsumerAlias.tsx"),
        `
import { useContext } from "react";
import { TaskContext } from "./TaskContext";
export function ConsumerAlias() {
  const ctx = useContext(TaskContext);
  const { tasks: currentTasks } = ctx;
  return <div>{currentTasks.length}</div>;
}
`,
        "utf8"
      );

      const symbolResolver = new SymbolReferenceResolver(testDir);
      symbolResolver.parseProject();

      const ctxResolver = new ContextUsageResolver(symbolResolver);
      const res = ctxResolver.analyzeProject();

      expect(res.consumers.length).toBe(3);

      const trace = ctxResolver.findContextTrace("TaskContext", "tasks");
      expect(trace.consumers.length).toBe(3);
      expect(trace.hasComputedAccess).toBe(false);
    } finally {
      safeCleanup(testDir);
    }
  });

  it("Computed Context Access Safety: halts on dynamic computed key ctx[key]", () => {
    const testDir = createTempDir("computed-context");
    try {
      writeFileSync(
        join(testDir, "TaskContext.tsx"),
        `
import { createContext } from "react";
export const TaskContext = createContext<any>(null);
`,
        "utf8"
      );

      writeFileSync(
        join(testDir, "DynamicConsumer.tsx"),
        `
import { useContext } from "react";
import { TaskContext } from "./TaskContext";
export function DynamicConsumer({ activeKey }: { activeKey: string }) {
  const ctx = useContext(TaskContext);
  const val = ctx[activeKey];
  return <div>{val}</div>;
}
`,
        "utf8"
      );

      const symbolResolver = new SymbolReferenceResolver(testDir);
      symbolResolver.parseProject();

      const ctxResolver = new ContextUsageResolver(symbolResolver);
      ctxResolver.analyzeProject();

      const trace = ctxResolver.findContextTrace("TaskContext");
      expect(trace.hasComputedAccess).toBe(true);
      expect(trace.unsafeReasons[0]).toContain("COMPUTED_CONTEXT_ACCESS");
    } finally {
      safeCleanup(testDir);
    }
  });
});
