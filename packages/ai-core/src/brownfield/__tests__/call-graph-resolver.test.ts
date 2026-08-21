import { describe, it, expect } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";
import { CallGraphResolver } from "../call-graph-resolver.js";

function createTempDir(prefix: string): string {
  const dir = join(tmpdir(), `aegis-callgraph-test-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function safeCleanup(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {}
}

describe("CallGraphResolver — Function Calls, JSX Components, & Test Traceability", () => {
  it("resolves function invocations, service method calls, and constructor instantiations", () => {
    const testDir = createTempDir("call-chains");
    try {
      writeFileSync(join(testDir, "db.ts"), `export class DatabaseService { query() { return []; } }`, "utf8");
      writeFileSync(
        join(testDir, "taskService.ts"),
        `
import { DatabaseService } from "./db";
export function getTasks() {
  const db = new DatabaseService();
  return db.query();
}
`,
        "utf8"
      );
      writeFileSync(
        join(testDir, "taskController.ts"),
        `
import { getTasks } from "./taskService";
export function handleGetTasks() {
  return getTasks();
}
`,
        "utf8"
      );

      const symbolResolver = new SymbolReferenceResolver(testDir);
      symbolResolver.parseProject();

      const callGraph = new CallGraphResolver(symbolResolver);
      const graph = callGraph.buildGraph();

      expect(graph.edges.length).toBeGreaterThanOrEqual(2);

      // Check caller of getTasks
      const getTasksCallers = callGraph.findDirectCallers("taskService.ts", "getTasks");
      expect(getTasksCallers.length).toBe(1);
      expect(getTasksCallers[0].fromFile).toBe("taskController.ts");
      expect(getTasksCallers[0].fromSymbol).toBe("handleGetTasks");
    } finally {
      safeCleanup(testDir);
    }
  });

  it("resolves JSX component hierarchies and rendering sites", () => {
    const testDir = createTempDir("jsx-hierarchy");
    try {
      writeFileSync(join(testDir, "Button.tsx"), `export function Button() { return null; }`, "utf8");
      writeFileSync(
        join(testDir, "TaskList.tsx"),
        `
import { Button } from "./Button";
export function TaskList() {
  return (
    <div>
      <Button />
    </div>
  );
}
`,
        "utf8"
      );

      const symbolResolver = new SymbolReferenceResolver(testDir);
      symbolResolver.parseProject();

      const callGraph = new CallGraphResolver(symbolResolver);
      callGraph.buildGraph();

      const buttonRenderers = callGraph.findJsxUsages("Button.tsx", "Button");
      expect(buttonRenderers.length).toBe(1);
      expect(buttonRenderers[0].fromFile).toBe("TaskList.tsx");
      expect(buttonRenderers[0].fromSymbol).toBe("TaskList");
      expect(buttonRenderers[0].callKind).toBe("jsx_render");
    } finally {
      safeCleanup(testDir);
    }
  });

  it("maps test suites to source symbols", () => {
    const testDir = createTempDir("test-trace");
    try {
      writeFileSync(join(testDir, "math.ts"), `export function calculateTax(amount: number) { return amount * 0.1; }`, "utf8");
      mkdirSync(join(testDir, "__tests__"), { recursive: true });
      writeFileSync(
        join(testDir, "__tests__", "math.test.ts"),
        `
import { calculateTax } from "../math";
describe("math", () => {
  it("computes tax", () => {
    expect(calculateTax(100)).toBe(10);
  });
});
`,
        "utf8"
      );

      const symbolResolver = new SymbolReferenceResolver(testDir);
      symbolResolver.parseProject();

      const callGraph = new CallGraphResolver(symbolResolver);
      callGraph.buildGraph();

      const testCallers = callGraph.findTestCallers("math.ts", "calculateTax");
      expect(testCallers.length).toBe(1);
      expect(testCallers[0].fromFile).toBe("__tests__/math.test.ts");
    } finally {
      safeCleanup(testDir);
    }
  });
});
