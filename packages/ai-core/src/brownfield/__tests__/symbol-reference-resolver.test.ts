import { describe, it, expect } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";

function createTempDir(prefix: string): string {
  const dir = join(tmpdir(), `aegis-sym-test-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function safeCleanup(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {}
}

describe("SymbolReferenceResolver — AST Symbol Declaration & Import/Export Resolution", () => {
  it("resolves top-level functions, classes, types, components, and exported variables", () => {
    const testDir = createTempDir("declarations");
    try {
      const filePath = join(testDir, "service.ts");
      writeFileSync(
        filePath,
        `
export interface TaskItem { id: string; title: string; }
export class TaskService {
  async update(id: string): Promise<TaskItem> { return { id, title: "" }; }
}
export const DEFAULT_PAGE_SIZE = 20;
export function calculateBudget(total: number) { return total * 0.8; }
export const TaskCard = () => null;
`,
        "utf8"
      );

      const resolver = new SymbolReferenceResolver(testDir);
      const summary = resolver.parseFile("service.ts");

      expect(summary.symbols.map(s => s.localName)).toContain("TaskItem");
      expect(summary.symbols.map(s => s.localName)).toContain("TaskService");
      expect(summary.symbols.map(s => s.localName)).toContain("DEFAULT_PAGE_SIZE");
      expect(summary.symbols.map(s => s.localName)).toContain("calculateBudget");
      expect(summary.symbols.map(s => s.localName)).toContain("TaskCard");

      const card = summary.symbols.find(s => s.localName === "TaskCard");
      expect(card?.kind).toBe("component");

      const iface = summary.symbols.find(s => s.localName === "TaskItem");
      expect(iface?.kind).toBe("interface");
    } finally {
      safeCleanup(testDir);
    }
  });

  it("resolves named, default, aliased, and namespace imports", () => {
    const testDir = createTempDir("imports");
    try {
      writeFileSync(join(testDir, "math.ts"), `export const add = (a: number, b: number) => a + b; export default class Calculator {}`, "utf8");
      writeFileSync(
        join(testDir, "consumer.ts"),
        `
import Calculator from "./math";
import { add as sum } from "./math";
import * as MathUtils from "./math";
`,
        "utf8"
      );

      const resolver = new SymbolReferenceResolver(testDir);
      resolver.parseProject();
      const summary = resolver.getSummary("consumer.ts");

      expect(summary).toBeDefined();
      expect(summary?.imports.length).toBe(3);

      const defImp = summary?.imports.find(i => i.importedName === "default");
      expect(defImp?.localAlias).toBe("Calculator");
      expect(defImp?.resolvedSourceFile).toBe("math.ts");

      const aliasImp = summary?.imports.find(i => i.importedName === "add");
      expect(aliasImp?.localAlias).toBe("sum");
      expect(aliasImp?.resolvedSourceFile).toBe("math.ts");

      const nsImp = summary?.imports.find(i => i.isNamespace);
      expect(nsImp?.localAlias).toBe("MathUtils");
      expect(nsImp?.resolvedSourceFile).toBe("math.ts");
    } finally {
      safeCleanup(testDir);
    }
  });

  it("resolves re-export chains across barrel files and wildcard exports (export * from)", () => {
    const testDir = createTempDir("barrels");
    try {
      mkdirSync(join(testDir, "features"), { recursive: true });
      writeFileSync(join(testDir, "features", "taskService.ts"), `export function updateTask() { return true; }`, "utf8");
      writeFileSync(join(testDir, "features", "userService.ts"), `export function fetchUser() { return true; }`, "utf8");
      // Barrel file
      writeFileSync(join(testDir, "features", "index.ts"), `export * from "./taskService";\nexport { fetchUser } from "./userService";`, "utf8");
      // Consumer
      writeFileSync(join(testDir, "app.ts"), `import { updateTask, fetchUser } from "./features";`, "utf8");

      const resolver = new SymbolReferenceResolver(testDir);
      resolver.parseProject();

      const chain1 = resolver.resolveExportChain("features/index.ts", "updateTask");
      expect(chain1?.targetFile).toBe("features/taskService.ts");
      expect(chain1?.targetSymbol.localName).toBe("updateTask");

      const chain2 = resolver.resolveExportChain("features/index.ts", "fetchUser");
      expect(chain2?.targetFile).toBe("features/userService.ts");
      expect(chain2?.targetSymbol.localName).toBe("fetchUser");

      // Check direct importers discovered through barrel
      const importers = resolver.findDirectImporters("features/taskService.ts", "updateTask");
      expect(importers.map(i => i.importerFile)).toContain("app.ts");
    } finally {
      safeCleanup(testDir);
    }
  });
});
