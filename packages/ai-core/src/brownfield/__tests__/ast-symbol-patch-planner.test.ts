import { describe, it, expect } from "vitest";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ASTSymbolPatchPlanner } from "../ast-symbol-patch-planner.js";
import type { ImpactClosureResult } from "../impact-closure-engine.js";

function createTempDir(prefix: string): string {
  const dir = join(tmpdir(), `aegis-ast-planner-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function safeCleanup(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {}
}

describe("ASTSymbolPatchPlanner — Patch Convergence & AST Node Preservation", () => {
  it("Patch Convergence: rejects missing impacted files with MISSING_IMPACTED_FILE", () => {
    const mockClosure: ImpactClosureResult = {
      status: "CLOSED",
      targetSymbols: [{ filePath: "service.ts", symbolName: "updateTask" }],
      mustChange: ["service.ts"],
      mayChange: ["controller.ts", "routes.ts"],
      requiredTests: ["__tests__/task.test.ts"],
      readOnly: ["auth.ts"],
      protected: ["package.json"],
      callGraphEdges: [],
    };

    // Planned files omits routes.ts
    const validation = ASTSymbolPatchPlanner.validatePatchPlan(mockClosure, ["service.ts", "controller.ts"]);
    expect(validation.status).toBe("MISSING_IMPACTED_FILE");
    expect(validation.error).toContain("routes.ts");
  });

  it("Patch Convergence: rejects unauthorized files with UNAUTHORIZED_FILE_IN_PATCH", () => {
    const mockClosure: ImpactClosureResult = {
      status: "CLOSED",
      targetSymbols: [{ filePath: "service.ts", symbolName: "updateTask" }],
      mustChange: ["service.ts"],
      mayChange: ["controller.ts"],
      requiredTests: [],
      readOnly: ["auth.ts"],
      protected: ["package.json"],
      callGraphEdges: [],
    };

    // Planned files includes unimpacted auth.ts
    const validation = ASTSymbolPatchPlanner.validatePatchPlan(mockClosure, ["service.ts", "controller.ts", "auth.ts"]);
    expect(validation.status).toBe("UNAUTHORIZED_FILE_IN_PATCH");
    expect(validation.error).toContain("auth.ts");
  });

  it("Patch Convergence: accepts exact match with CLOSED_AND_CONVERGENT", () => {
    const mockClosure: ImpactClosureResult = {
      status: "CLOSED",
      targetSymbols: [{ filePath: "service.ts", symbolName: "updateTask" }],
      mustChange: ["service.ts"],
      mayChange: ["controller.ts"],
      requiredTests: [],
      readOnly: ["auth.ts"],
      protected: ["package.json"],
      callGraphEdges: [],
    };

    const validation = ASTSymbolPatchPlanner.validatePatchPlan(mockClosure, ["service.ts", "controller.ts"]);
    expect(validation.status).toBe("CLOSED_AND_CONVERGENT");
  });

  it("AST Preservation: modifies ONLY target function node and preserves unrelated functions, comments, and formatting bit-for-bit", () => {
    const testDir = createTempDir("ast-preservation");
    try {
      const originalCode = `
// Important module header comment
import { config } from "./config";

/**
 * Helper function A
 */
export function functionA(x: number) {
  // Comment inside A
  return x + 1;
}

/**
 * Target function B to modify
 */
export function functionB(y: string) {
  return "old_" + y;
}

/**
 * Unrelated function C
 */
export function functionC(z: boolean) {
  /* Comment inside C */
  return !z;
}
`;

      writeFileSync(join(testDir, "module.ts"), originalCode, "utf8");

      const planner = new ASTSymbolPatchPlanner(testDir);
      const patchOp = planner.planFunctionUpdate("module.ts", "functionB", () => {
        return `export function functionB(y: string, prefix = "new_") {\n  return prefix + y;\n}`;
      });

      expect(patchOp).toBeDefined();

      const updatedCode = ASTSymbolPatchPlanner.applyPatchesToContent(originalCode, [patchOp!]);

      // Verify functionB was updated
      expect(updatedCode).toContain(`export function functionB(y: string, prefix = "new_") {\n  return prefix + y;\n}`);

      // Verify functionA, functionC, and all comments remain bit-for-bit unchanged
      expect(updatedCode).toContain("// Important module header comment");
      expect(updatedCode).toContain("/**\n * Helper function A\n */\nexport function functionA(x: number) {\n  // Comment inside A\n  return x + 1;\n}");
      expect(updatedCode).toContain("/**\n * Unrelated function C\n */\nexport function functionC(z: boolean) {\n  /* Comment inside C */\n  return !z;\n}");
    } finally {
      safeCleanup(testDir);
    }
  });

  it("AST Call Sites: plans surgical call-site updates in caller files", () => {
    const testDir = createTempDir("callsite-update");
    try {
      const callerCode = `
import { functionB } from "./module";

export function handleRequest() {
  const res1 = functionB("first");
  const res2 = functionB("second");
  return [res1, res2];
}
`;
      writeFileSync(join(testDir, "caller.ts"), callerCode, "utf8");

      const planner = new ASTSymbolPatchPlanner(testDir);
      const callSiteOps = planner.planCallSiteUpdate("caller.ts", "functionB", (orig) => {
        return orig.replace(/\("([^"]+)"\)/, '("$1", "custom_")');
      });

      expect(callSiteOps.length).toBe(2);

      const updatedCaller = ASTSymbolPatchPlanner.applyPatchesToContent(callerCode, callSiteOps);
      expect(updatedCaller).toContain(`const res1 = functionB("first", "custom_");`);
      expect(updatedCaller).toContain(`const res2 = functionB("second", "custom_");`);
    } finally {
      safeCleanup(testDir);
    }
  });
});
