/**
 * Project Generation & Brownfield Refactoring E2E Acceptance Test
 * Aegis V2.3 Project 2 Phase 5.2
 */

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";
import {
  ASTSymbolRenamePlanner,
  RenamePreviewEngine,
  StructuralRefactoringPlanner,
  StructuralRefactoringPreviewEngine,
  SymbolDefinitionResolver,
} from "../refactoring/index.js";

describe("Phase 5.2: Project Generation & Brownfield Refactoring Integration", () => {
  const projectRoot = resolve(process.cwd(), "../../generated/project");

  it("GATE 1-4: Validates fresh generated project structure and contracts", () => {
    expect(existsSync(projectRoot)).toBe(true);

    const pkgPath = join(projectRoot, "package.json");
    expect(existsSync(pkgPath)).toBe(true);
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    expect(pkg.name).toBeDefined();
    expect(pkg.dependencies).toBeDefined();

    // Check core configuration files
    expect(existsSync(join(projectRoot, "tsconfig.json"))).toBe(true);
    expect(existsSync(join(projectRoot, "vite.config.ts"))).toBe(true);
    expect(existsSync(join(projectRoot, "src/App.tsx"))).toBe(true);
    expect(existsSync(join(projectRoot, "src/routes.tsx"))).toBe(true);
    expect(existsSync(join(projectRoot, "src/services/api.ts"))).toBe(true);

    // Check .aegis contracts
    const aegisDir = join(projectRoot, ".aegis");
    expect(existsSync(aegisDir)).toBe(true);
  });

  it("GATE 5-6: Validates TypeScript compilation and production build on generated project", () => {
    // 1. TypeScript compiler check
    let tsError = false;
    try {
      execSync("npx --yes tsc --noEmit", { cwd: projectRoot, stdio: "pipe" });
    } catch {
      tsError = true;
    }
    expect(tsError).toBe(false);

    // 2. Vite production build
    let buildError = false;
    try {
      execSync("npx --yes vite build", { cwd: projectRoot, stdio: "pipe" });
    } catch {
      buildError = true;
    }
    expect(buildError).toBe(false);
  });

  it("GATE 10a: Non-destructive AST Symbol Rename planning on generated project", () => {
    const defResolver = new SymbolDefinitionResolver(projectRoot);
    const targetSymbolDef = defResolver.resolveDefinition("src/services/api.ts", "getAll")
      || defResolver.resolveDefinition("src/services/api.ts", "expenseApiClient")
      || defResolver.resolveDefinition("src/services/api.ts", "api")
      || { name: "getAll" };
    const targetSymbol = targetSymbolDef.name;

    const planner = new ASTSymbolRenamePlanner(projectRoot);
    const request = {
      projectPath: projectRoot,
      sourceFile: "src/services/api.ts",
      symbolName: targetSymbol,
      newName: targetSymbol + "V2Test",
    };

    const plan = planner.planRename(request);
    expect(plan.status).toBe("READY");
    expect(plan.planHash).toBeDefined();
    expect(plan.planHash.length).toBe(64);
    expect(plan.patchHash).toBeDefined();
    expect(plan.patches.length).toBeGreaterThan(0);

    // Verify side-effect-free preview
    const preview = RenamePreviewEngine.generatePreview(request, planner);
    expect(preview.planHash).toBe(plan.planHash);
    expect(preview.isApplyAllowed).toBe(true);
    expect(preview.fileDiffs.length).toBeGreaterThan(0);
  });

  it("GATE 10b: Non-destructive Structural Move planning on generated project", () => {
    const planner = new StructuralRefactoringPlanner(projectRoot);
    const request = {
      kind: "MOVE_SYMBOL" as const,
      projectPath: projectRoot,
      sourceFile: "src/services/studentService.ts",
      symbolName: "studentService",
      destinationFile: "src/utils/student-utils.ts",
    };

    const plan = planner.plan(request);
    expect(plan.impactStatus).toBe("READY");
    expect(plan.planHash).toBeDefined();
    expect(plan.planHash.length).toBe(64);
    expect(plan.patchOperations.length).toBeGreaterThan(0);

    // Verify structural preview side-effect safety
    const previewEngine = new StructuralRefactoringPreviewEngine(projectRoot);
    const preview = previewEngine.generatePreview(plan);
    expect(preview.planHash).toBe(plan.planHash);
    expect(preview.impactStatus).toBe("READY");
    expect(preview.fileDiffs.length).toBeGreaterThan(0);
  });

  it("DETERMINISM: Generates equivalent deterministic hashes across multiple plan passes", () => {
    const defResolver = new SymbolDefinitionResolver(projectRoot);
    const targetSymbolDef = defResolver.resolveDefinition("src/services/api.ts", "getAll")
      || defResolver.resolveDefinition("src/services/api.ts", "expenseApiClient")
      || defResolver.resolveDefinition("src/services/api.ts", "api")
      || { name: "getAll" };
    const targetSymbol = targetSymbolDef.name;

    const renamePlanner = new ASTSymbolRenamePlanner(projectRoot);
    const renameReq = {
      projectPath: projectRoot,
      sourceFile: "src/services/api.ts",
      symbolName: targetSymbol,
      newName: targetSymbol + "V2Test",
    };

    const planA = renamePlanner.planRename(renameReq);
    const planB = renamePlanner.planRename(renameReq);
    expect(planA.planHash).toBe(planB.planHash);
    expect(planA.patchHash).toBe(planB.patchHash);

    const movePlanner = new StructuralRefactoringPlanner(projectRoot);
    const moveReq = {
      kind: "MOVE_SYMBOL" as const,
      projectPath: projectRoot,
      sourceFile: "src/features/expenses/services/expense.service.ts",
      symbolName: "expense_service",
      destinationFile: "src/utils/expense-utils.ts",
    };

    const movePlanA = movePlanner.plan(moveReq);
    const movePlanB = movePlanner.plan(moveReq);
    expect(movePlanA.planHash).toBe(movePlanB.planHash);
    expect(movePlanA.patchHash).toBe(movePlanB.patchHash);
  });
});
