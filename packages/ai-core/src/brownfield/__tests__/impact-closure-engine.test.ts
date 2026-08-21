import { describe, it, expect } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ImpactClosureEngine } from "../impact-closure-engine.js";

function createTempDir(prefix: string): string {
  const dir = join(tmpdir(), `aegis-closure-test-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function safeCleanup(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {}
}

describe("ImpactClosureEngine — Complete Fixture Matrix (Scenarios A–L) & Invariants", () => {
  it("Scenario A–J: computes deterministic, closed impact sets across imports, call chains, JSX, and tests", () => {
    const testDir = createTempDir("scenarios-a-j");
    try {
      // 1. Model / DB (Scenario H)
      writeFileSync(join(testDir, "model.ts"), `export interface TaskModel { id: string; title: string; }\nexport const DEFAULT_MODEL = "Task";`, "utf8");

      // 2. Service (Scenario A, B, G, H)
      writeFileSync(
        join(testDir, "taskService.ts"),
        `
import { TaskModel } from "./model";
export function updateTask(id: string, title: string): TaskModel {
  return { id, title };
}
export default class TaskServiceFacade {}
`,
        "utf8"
      );

      // 3. Barrel export (Scenario E, F)
      writeFileSync(join(testDir, "index.ts"), `export * from "./taskService";\nexport { DEFAULT_MODEL } from "./model";`, "utf8");

      // 4. Aliased and Namespace consumers (Scenario C, D)
      writeFileSync(
        join(testDir, "taskController.ts"),
        `
import { updateTask as performTaskUpdate } from "./index";
import * as ServiceNamespace from "./taskService";

export function handleUpdateTask(id: string, title: string) {
  return performTaskUpdate(id, title);
}
`,
        "utf8"
      );

      // 5. UI Component & JSX usage (Scenario I)
      writeFileSync(
        join(testDir, "TaskCard.tsx"),
        `
import { handleUpdateTask } from "./taskController";
export function TaskCard({ id }: { id: string }) {
  const handleClick = () => handleUpdateTask(id, "done");
  return <button onClick={handleClick}>Update</button>;
}
`,
        "utf8"
      );

      // 6. Test file (Scenario J)
      mkdirSync(join(testDir, "__tests__"), { recursive: true });
      writeFileSync(
        join(testDir, "__tests__", "task.test.ts"),
        `
import { updateTask } from "../taskService";
describe("taskService", () => {
  it("updates task", () => {
    expect(updateTask("1", "title")).toBeDefined();
  });
});
`,
        "utf8"
      );

      // 7. Unrelated file (Zero False Positive verification)
      writeFileSync(join(testDir, "unrelatedAuth.ts"), `export function loginUser() { return "ok"; }`, "utf8");

      const engine = new ImpactClosureEngine(testDir);
      const result = engine.computeClosure([
        { filePath: "taskService.ts", symbolName: "updateTask" }
      ]);

      expect(result.status).toBe("CLOSED");
      expect(result.mustChange).toContain("taskService.ts");
      expect(result.mayChange).toContain("taskController.ts");
      expect(result.mayChange).toContain("TaskCard.tsx");
      expect(result.requiredTests).toContain("__tests__/task.test.ts");

      // Verify unrelatedAuth.ts is strictly in readOnly
      expect(result.readOnly).toContain("unrelatedAuth.ts");
      expect(result.mustChange).not.toContain("unrelatedAuth.ts");
      expect(result.mayChange).not.toContain("unrelatedAuth.ts");
    } finally {
      safeCleanup(testDir);
    }
  });

  it("Scenario K: Missing or ambiguous target symbol halts with IMPACT_ANALYSIS_INCOMPLETE", () => {
    const testDir = createTempDir("scenario-k");
    try {
      writeFileSync(join(testDir, "service.ts"), `export const a = 1;`, "utf8");

      const engine = new ImpactClosureEngine(testDir);
      const result = engine.computeClosure([
        { filePath: "service.ts", symbolName: "nonExistentSymbol" }
      ]);

      expect(result.status).toBe("IMPACT_ANALYSIS_INCOMPLETE");
      expect(result.unresolvedReasons?.[0].reason).toContain("TARGET_SYMBOL_NOT_FOUND");
    } finally {
      safeCleanup(testDir);
    }
  });

  it("Scenario L: Unresolved dynamic import halts with IMPACT_ANALYSIS_INCOMPLETE and never guesses", () => {
    const testDir = createTempDir("scenario-l");
    try {
      writeFileSync(join(testDir, "service.ts"), `export function calc() { return 42; }`, "utf8");
      writeFileSync(
        join(testDir, "dynamicCaller.ts"),
        `
export async function loadModule(name: string) {
  const mod = await import(\`./plugins/\${name}\`);
  return mod;
}
`,
        "utf8"
      );

      const engine = new ImpactClosureEngine(testDir);
      const result = engine.computeClosure([
        { filePath: "service.ts", symbolName: "calc" }
      ]);

      expect(result.status).toBe("IMPACT_ANALYSIS_INCOMPLETE");
      expect(result.unresolvedReasons?.[0].reason).toContain("UNRESOLVED_DYNAMIC_IMPORT");
    } finally {
      safeCleanup(testDir);
    }
  });

  it("Property Invariant: Idempotence and Determinism across repeated analyses", () => {
    const testDir = createTempDir("properties");
    try {
      writeFileSync(join(testDir, "utils.ts"), `export function add(a: number, b: number) { return a + b; }`, "utf8");
      writeFileSync(join(testDir, "calc.ts"), `import { add } from "./utils"; export function run() { return add(1, 2); }`, "utf8");

      const engine1 = new ImpactClosureEngine(testDir);
      const res1 = engine1.computeClosure([{ filePath: "utils.ts", symbolName: "add" }]);

      const engine2 = new ImpactClosureEngine(testDir);
      const res2 = engine2.computeClosure([{ filePath: "utils.ts", symbolName: "add" }]);

      expect(res1.status).toBe(res2.status);
      expect(res1.mustChange).toEqual(res2.mustChange);
      expect(res1.mayChange).toEqual(res2.mayChange);
      expect(res1.requiredTests).toEqual(res2.requiredTests);
      expect(res1.readOnly).toEqual(res2.readOnly);
    } finally {
      safeCleanup(testDir);
    }
  });

  it("Performance Benchmark: Measures actual AST parse, resolution, and closure timing across scale", () => {
    const testDir = createTempDir("benchmark");
    try {
      const fileCounts = [10, 50, 100, 300];
      const benchmarkResults: Record<number, { parseMs: number; closureMs: number; totalMs: number }> = {};

      for (const count of fileCounts) {
        const subDir = join(testDir, `scale-${count}`);
        mkdirSync(subDir, { recursive: true });

        // Base service
        writeFileSync(join(subDir, "baseService.ts"), `export function baseOperation(n: number) { return n * 2; }`, "utf8");

        for (let i = 1; i < count; i++) {
          const prev = i === 1 ? "./baseService" : `./file_${i - 1}`;
          const fnName = i === 1 ? "baseOperation" : `fn_${i - 1}`;
          writeFileSync(
            join(subDir, `file_${i}.ts`),
            `import { ${fnName} } from "${prev}";\nexport function fn_${i}(n: number) { return ${fnName}(n) + 1; }\n`,
            "utf8"
          );
        }

        const startTotal = performance.now();
        const engine = new ImpactClosureEngine(subDir);

        const startClosure = performance.now();
        const result = engine.computeClosure([{ filePath: "baseService.ts", symbolName: "baseOperation" }]);
        const endTotal = performance.now();

        expect(result.status).toBe("CLOSED");
        expect(result.mustChange).toContain("baseService.ts");
        expect(result.mayChange.length).toBe(count - 1);

        benchmarkResults[count] = {
          parseMs: Number((startClosure - startTotal).toFixed(2)),
          closureMs: Number((endTotal - startClosure).toFixed(2)),
          totalMs: Number((endTotal - startTotal).toFixed(2)),
        };
      }

      console.log("\n[ImpactClosureEngine AST Performance Benchmark Results]");
      console.table(benchmarkResults);
    } finally {
      safeCleanup(testDir);
    }
  });
});
