/**
 * ReactPropRefactoring Test Suite — Aegis V2.3 Project 2 Phase 4
 *
 * Tests:
 * - React prop addition: Props interface, destructuring, and JSX call site updates
 * - React prop removal when safe
 * - React prop removal BLOCKED when prop is referenced in component body
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SymbolDefinitionResolver } from "../refactoring/symbol-definition-resolver.js";
import { ReactPropRefactoringPlanner } from "../refactoring/react-prop-refactoring-planner.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("ReactPropRefactoringPlanner Tests", () => {
  let testDir: string;
  let defResolver: SymbolDefinitionResolver;
  let planner: ReactPropRefactoringPlanner;

  beforeEach(() => {
    testDir = makeProject("aegis-prop-");
    defResolver = new SymbolDefinitionResolver(testDir);
    planner = new ReactPropRefactoringPlanner(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Plans React prop addition to interface, destructuring, and JSX call sites", () => {
    writeFileSync(
      join(testDir, "src", "TaskCard.tsx"),
      `export interface TaskCardProps {\n  title: string;\n}\n\nexport const TaskCard = ({ title }: TaskCardProps) => {\n  return <div>{title}</div>;\n};\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "TaskList.tsx"),
      `import { TaskCard } from "./TaskCard.js";\nexport const TaskList = () => <TaskCard title="Clean" />;\n`,
      "utf8"
    );

    const def = defResolver.resolveDefinition("src/TaskCard.tsx", "TaskCard")!;
    const res = planner.planPropAddition(
      def,
      { name: "priority", type: "string", defaultValue: '"HIGH"' },
      ["src/TaskCard.tsx", "src/TaskList.tsx"]
    );

    expect(res.valid).toBe(true);
    expect(res.interfacePatch).toBeDefined();
    expect(res.interfacePatch!.replacementSnippet).toContain("priority: string");
    expect(res.componentPatch).toBeDefined();
    expect(res.componentPatch!.replacementSnippet).toContain("priority");
    expect(res.jsxPatches.length).toBe(1);
    expect(res.jsxPatches[0].replacementSnippet).toContain('priority={"HIGH"}');
  });

  it("TEST 2: React prop removal is BLOCKED when prop is referenced in component body", () => {
    writeFileSync(
      join(testDir, "src", "TaskCard.tsx"),
      `export const TaskCard = ({ title, priority }: any) => {\n  return <div>{title} - {priority}</div>;\n};\n`,
      "utf8"
    );

    const def = defResolver.resolveDefinition("src/TaskCard.tsx", "TaskCard")!;
    const res = planner.planPropRemoval(def, "priority", ["src/TaskCard.tsx"]);

    expect(res.valid).toBe(false);
    expect(res.blockedReason).toContain("BLOCKED: Prop \"priority\" is still referenced");
  });
});
