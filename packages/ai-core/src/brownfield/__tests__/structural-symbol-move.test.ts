/**
 * Structural Symbol Move Test Suite — Aegis V2.3 Project 2 Phase 4.2
 *
 * Tests:
 * 1. Move function (source removal, destination insertion, consumer imports)
 * 2. Move class
 * 3. Move interface
 * 4. Move type alias
 * 5. Move React component
 * 6. Move hook
 * 7. Move enum
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { StructuralRefactoringPlanner } from "../refactoring/structural-refactoring-planner.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "services"), { recursive: true });
  mkdirSync(join(dir, "src", "components"), { recursive: true });
  mkdirSync(join(dir, "src", "hooks"), { recursive: true });
  mkdirSync(join(dir, "src", "types"), { recursive: true });
  mkdirSync(join(dir, "src", "utils"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("Structural Symbol Move Tests", () => {
  let testDir: string;
  let planner: StructuralRefactoringPlanner;

  beforeEach(() => {
    testDir = makeProject("aegis-struct-move-");
    planner = new StructuralRefactoringPlanner(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Move function generates removal and insertion patches", () => {
    writeFileSync(
      join(testDir, "src", "services", "mathService.ts"),
      `export function add(a: number, b: number) {\n  return a + b;\n}\n`,
      "utf8"
    );

    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/mathService.ts",
      symbolName: "add",
      destinationFile: "src/utils/mathUtils.ts",
    });

    expect(plan.impactStatus).toBe("READY");
    expect(plan.sourceSymbol.kind).toBe("function");
    expect(plan.sourceSymbol.declarationSnippet).toContain("function add");

    const removeOp = plan.patchOperations.find(o => o.operationKind === "REMOVE_DECLARATION");
    expect(removeOp).toBeDefined();
    expect(removeOp?.filePath).toBe("src/services/mathService.ts");

    const insertOp = plan.patchOperations.find(o => o.operationKind === "INSERT_DECLARATION");
    expect(insertOp).toBeDefined();
    expect(insertOp?.filePath).toBe("src/utils/mathUtils.ts");
    expect(insertOp?.replacement).toContain("function add");
  });

  it("TEST 2: Move class", () => {
    writeFileSync(
      join(testDir, "src", "services", "authService.ts"),
      `export class AuthManager {\n  login() { return true; }\n}\n`,
      "utf8"
    );

    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/services/authService.ts",
      symbolName: "AuthManager",
      destinationFile: "src/utils/authManager.ts",
    });

    expect(plan.impactStatus).toBe("READY");
    expect(plan.sourceSymbol.kind).toBe("class");
  });

  it("TEST 3: Move interface", () => {
    writeFileSync(
      join(testDir, "src", "types", "user.ts"),
      `export interface UserProfile {\n  id: string;\n  name: string;\n}\n`,
      "utf8"
    );

    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/types/user.ts",
      symbolName: "UserProfile",
      destinationFile: "src/types/profile.ts",
    });

    expect(plan.impactStatus).toBe("READY");
    expect(plan.sourceSymbol.kind).toBe("interface");
  });

  it("TEST 4: Move type alias", () => {
    writeFileSync(
      join(testDir, "src", "types", "user.ts"),
      `export type UserId = string;\n`,
      "utf8"
    );

    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/types/user.ts",
      symbolName: "UserId",
      destinationFile: "src/types/identifiers.ts",
    });

    expect(plan.impactStatus).toBe("READY");
    expect(plan.sourceSymbol.kind).toBe("type");
  });

  it("TEST 5: Move React component", () => {
    writeFileSync(
      join(testDir, "src", "components", "Header.tsx"),
      `export function Header() {\n  return <div>Header</div>;\n}\n`,
      "utf8"
    );

    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/components/Header.tsx",
      symbolName: "Header",
      destinationFile: "src/components/Navigation.tsx",
    });

    expect(plan.impactStatus).toBe("READY");
    expect(plan.sourceSymbol.kind).toBe("component");
  });

  it("TEST 6: Move custom hook", () => {
    writeFileSync(
      join(testDir, "src", "hooks", "useAuth.ts"),
      `export function useAuthUser() {\n  return { user: "test" };\n}\n`,
      "utf8"
    );

    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/hooks/useAuth.ts",
      symbolName: "useAuthUser",
      destinationFile: "src/hooks/useUser.ts",
    });

    expect(plan.impactStatus).toBe("READY");
    expect(plan.sourceSymbol.kind).toBe("hook");
  });

  it("TEST 7: Move enum", () => {
    writeFileSync(
      join(testDir, "src", "types", "roles.ts"),
      `export enum UserRole {\n  ADMIN = "ADMIN",\n  USER = "USER"\n}\n`,
      "utf8"
    );

    const plan = planner.plan({
      kind: "MOVE_SYMBOL",
      projectPath: testDir,
      sourceFile: "src/types/roles.ts",
      symbolName: "UserRole",
      destinationFile: "src/types/permissions.ts",
    });

    expect(plan.impactStatus).toBe("READY");
    expect(plan.sourceSymbol.kind).toBe("enum");
  });
});
