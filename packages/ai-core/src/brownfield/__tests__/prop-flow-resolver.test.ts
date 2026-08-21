import { describe, it, expect } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";
import { PropFlowResolver } from "../prop-flow-resolver.js";

function createTempDir(prefix: string): string {
  const dir = join(tmpdir(), `aegis-prop-flow-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function safeCleanup(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {}
}

describe("PropFlowResolver — Direct Props, Multi-Tier Hierarchy & Safety Halts", () => {
  it("Direct Props: resolves component prop declarations, default values, and JSX usages", () => {
    const testDir = createTempDir("direct-props");
    try {
      writeFileSync(
        join(testDir, "TaskCard.tsx"),
        `
export interface Task { id: string; title: string; }
export function TaskCard({ task, compact = false }: { task: Task; compact?: boolean }) {
  return <div className={compact ? "compact" : "full"}>{task.title}</div>;
}
`,
        "utf8"
      );

      writeFileSync(
        join(testDir, "TaskList.tsx"),
        `
import { TaskCard } from "./TaskCard";
export function TaskList() {
  const item = { id: "1", title: "Test" };
  return <TaskCard task={item} compact={true} />;
}
`,
        "utf8"
      );

      const symbolResolver = new SymbolReferenceResolver(testDir);
      symbolResolver.parseProject();

      const propResolver = new PropFlowResolver(symbolResolver);
      const result = propResolver.analyzeProject();

      expect(result.usages.length).toBe(2); // task, compact
      expect(result.edges.some(e => e.toComponent === "TaskCard" && e.propName === "compact")).toBe(true);
      expect(result.unsafePatterns.length).toBe(0);
    } finally {
      safeCleanup(testDir);
    }
  });

  it("Three-Level Prop Drilling: traces prop flow across Page -> List -> Card -> Actions", () => {
    const testDir = createTempDir("prop-drilling");
    try {
      writeFileSync(
        join(testDir, "TaskActions.tsx"),
        `
export function TaskActions({ task, onUpdate }: { task: any; onUpdate: (t: any) => void }) {
  return <button onClick={() => onUpdate(task)}>Update</button>;
}
`,
        "utf8"
      );

      writeFileSync(
        join(testDir, "TaskCard.tsx"),
        `
import { TaskActions } from "./TaskActions";
export function TaskCard({ task, onUpdate }: { task: any; onUpdate: (t: any) => void }) {
  return <div><TaskActions task={task} onUpdate={onUpdate} /></div>;
}
`,
        "utf8"
      );

      writeFileSync(
        join(testDir, "TaskList.tsx"),
        `
import { TaskCard } from "./TaskCard";
export function TaskList({ items, onUpdate }: { items: any[]; onUpdate: (t: any) => void }) {
  return <div>{items.map(t => <TaskCard key={t.id} task={t} onUpdate={onUpdate} />)}</div>;
}
`,
        "utf8"
      );

      const symbolResolver = new SymbolReferenceResolver(testDir);
      symbolResolver.parseProject();

      const propResolver = new PropFlowResolver(symbolResolver);
      const result = propResolver.analyzeProject();

      const trace = propResolver.findPropTrace("TaskActions.tsx", "TaskActions", "task");
      expect(trace.forwardingLayers.length).toBeGreaterThanOrEqual(1);
      expect(trace.hasUnsafeSpread).toBe(false);
    } finally {
      safeCleanup(testDir);
    }
  });

  it("Prop Spread Safety: flags <Component {...props} /> as unsafe and ambiguous", () => {
    const testDir = createTempDir("prop-spread");
    try {
      writeFileSync(
        join(testDir, "TaskCard.tsx"),
        `
export function TaskCard({ task }: { task: any }) {
  return <div>{task.title}</div>;
}
`,
        "utf8"
      );

      writeFileSync(
        join(testDir, "TaskList.tsx"),
        `
import { TaskCard } from "./TaskCard";
export function TaskList(props: any) {
  return <TaskCard {...props} />;
}
`,
        "utf8"
      );

      const symbolResolver = new SymbolReferenceResolver(testDir);
      symbolResolver.parseProject();

      const propResolver = new PropFlowResolver(symbolResolver);
      const result = propResolver.analyzeProject();

      expect(result.unsafePatterns.some(p => p.patternType === "UNSAFE_PROP_SPREAD")).toBe(true);

      const trace = propResolver.findPropTrace("TaskCard.tsx", "TaskCard", "task");
      expect(trace.hasUnsafeSpread).toBe(true);
      expect(trace.unsafeReasons[0]).toContain("UNSAFE_PROP_SPREAD");
    } finally {
      safeCleanup(testDir);
    }
  });

  it("Dynamic Callback Safety: flags dynamic element access callbacks as unsafe", () => {
    const testDir = createTempDir("dynamic-callback");
    try {
      writeFileSync(
        join(testDir, "TaskCard.tsx"),
        `
export function TaskCard({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick}>Click</button>;
}
`,
        "utf8"
      );

      writeFileSync(
        join(testDir, "TaskList.tsx"),
        `
import { TaskCard } from "./TaskCard";
export function TaskList({ handlers, key }: { handlers: Record<string, () => void>; key: string }) {
  return <TaskCard onClick={handlers[key]} />;
}
`,
        "utf8"
      );

      const symbolResolver = new SymbolReferenceResolver(testDir);
      symbolResolver.parseProject();

      const propResolver = new PropFlowResolver(symbolResolver);
      const result = propResolver.analyzeProject();

      expect(result.unsafePatterns.some(p => p.patternType === "DYNAMIC_CALLBACK")).toBe(true);
    } finally {
      safeCleanup(testDir);
    }
  });
});
