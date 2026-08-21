/**
 * SymbolReferenceIndex Test Suite — Aegis V2.3 Project 2 Phase 3
 *
 * Tests:
 * - Named imports & Aliased imports (preserving alias!)
 * - Barrel re-exports & Aliased re-exports (preserving public alias!)
 * - React JSX tags (<Component /> & </Component>)
 * - Scope & Shadowing isolation (inner variable not touched)
 * - Namespace access (utils.foo())
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SymbolDefinitionResolver } from "../refactoring/symbol-definition-resolver.js";
import { SymbolReferenceIndex } from "../refactoring/symbol-reference-index.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("SymbolReferenceIndex Tests", () => {
  let testDir: string;
  let defResolver: SymbolDefinitionResolver;
  let refIndex: SymbolReferenceIndex;

  beforeEach(() => {
    testDir = makeProject("aegis-ref-index-");
    defResolver = new SymbolDefinitionResolver(testDir);
    refIndex = new SymbolReferenceIndex(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Discovers named import references and call sites across files", () => {
    writeFileSync(
      join(testDir, "src", "math.ts"),
      `export function calculateTask(val: number): number {\n  return val * 2;\n}\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "consumer.ts"),
      `import { calculateTask } from "./math.js";\n\nexport function run() {\n  return calculateTask(10);\n}\n`,
      "utf8"
    );

    const def = defResolver.resolveDefinition("src/math.ts", "calculateTask")!;
    const refs = refIndex.findReferences(def, ["src/math.ts", "src/consumer.ts"], "calculateTaskDetails");

    expect(refs.length).toBe(3); // definition, import specifier, call site
    const defRef = refs.find(r => r.filePath === "src/math.ts" && r.kind === "DEFINITION");
    const importRef = refs.find(r => r.filePath === "src/consumer.ts" && r.kind === "NAMED_IMPORT");
    const callRef = refs.find(r => r.filePath === "src/consumer.ts" && r.kind === "CALL_EXPRESSION");

    expect(defRef).toBeDefined();
    expect(importRef).toBeDefined();
    expect(callRef).toBeDefined();
    expect(callRef!.replacementText).toBe("calculateTaskDetails");
  });

  it("TEST 2: Preserves local alias in `import { foo as bar }`", () => {
    writeFileSync(
      join(testDir, "src", "math.ts"),
      `export function calculateTask(val: number): number {\n  return val * 2;\n}\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "aliasedConsumer.ts"),
      `import { calculateTask as calculate } from "./math.js";\n\nexport function run() {\n  return calculate(10);\n}\n`,
      "utf8"
    );

    const def = defResolver.resolveDefinition("src/math.ts", "calculateTask")!;
    const refs = refIndex.findReferences(def, ["src/math.ts", "src/aliasedConsumer.ts"], "calculateTaskDetails");

    const aliasImportRef = refs.find(r => r.filePath === "src/aliasedConsumer.ts" && r.kind === "ALIASED_IMPORT");
    expect(aliasImportRef).toBeDefined();
    expect(aliasImportRef!.matchedText).toBe("calculateTask");
    expect(aliasImportRef!.replacementText).toBe("calculateTaskDetails");
    expect(aliasImportRef!.aliasName).toBe("calculate");

    // The call site `calculate(10)` should NOT be renamed because it uses the local alias `calculate`
    const callRefs = refs.filter(r => r.filePath === "src/aliasedConsumer.ts" && r.kind === "CALL_EXPRESSION");
    expect(callRefs.length).toBe(0);
  });

  it("TEST 3: Preserves external alias in barrel re-exports `export { foo as publicFoo }`", () => {
    writeFileSync(
      join(testDir, "src", "internal.ts"),
      `export function doAction() { return "ok"; }\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "barrel.ts"),
      `export { doAction as publicAction } from "./internal.js";\n`,
      "utf8"
    );

    const def = defResolver.resolveDefinition("src/internal.ts", "doAction")!;
    const refs = refIndex.findReferences(def, ["src/internal.ts", "src/barrel.ts"], "executeAction");

    const barrelRef = refs.find(r => r.filePath === "src/barrel.ts");
    expect(barrelRef).toBeDefined();
    expect(barrelRef!.kind).toBe("BARREL_RE_EXPORT");
    expect(barrelRef!.matchedText).toBe("doAction");
    expect(barrelRef!.replacementText).toBe("executeAction");
    expect(barrelRef!.aliasName).toBe("publicAction");
  });

  it("TEST 4: Discovers React JSX opening and closing element tags", () => {
    writeFileSync(
      join(testDir, "src", "TaskCard.tsx"),
      `export const TaskCard = () => { return <div>Task</div>; };\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "TaskList.tsx"),
      `import { TaskCard } from "./TaskCard.js";\n\nexport const TaskList = () => {\n  return <TaskCard></TaskCard>;\n};\n`,
      "utf8"
    );

    const def = defResolver.resolveDefinition("src/TaskCard.tsx", "TaskCard")!;
    const refs = refIndex.findReferences(def, ["src/TaskCard.tsx", "src/TaskList.tsx"], "TaskItem");

    const jsxRefs = refs.filter(r => r.filePath === "src/TaskList.tsx" && r.kind === "JSX_ELEMENT");
    expect(jsxRefs.length).toBe(2); // opening <TaskCard> and closing </TaskCard>
    expect(jsxRefs[0].replacementText).toBe("TaskItem");
    expect(jsxRefs[1].replacementText).toBe("TaskItem");
  });

  it("TEST 5: Scope Shadowing Isolation — does NOT rename inner shadowed variable", () => {
    writeFileSync(
      join(testDir, "src", "scopeDemo.ts"),
      `export const count = 1;\n\nexport function testFunc() {\n  const count = 99;\n  return count;\n}\n\nexport function otherFunc() {\n  return count;\n}\n`,
      "utf8"
    );

    const def = defResolver.resolveDefinition("src/scopeDemo.ts", "count")!;
    const refs = refIndex.findReferences(def, ["src/scopeDemo.ts"], "totalCount");

    // Definition + otherFunc usage = 2 refs. Inner testFunc 'count = 99' and 'return count' must NOT be matched!
    expect(refs.length).toBe(2);
    expect(refs[0].kind).toBe("DEFINITION");
    expect(refs[1].kind).toBe("IDENTIFIER_USAGE");
    // Verify line of otherFunc usage
    expect(refs[1].line).toBe(9);
  });
});
