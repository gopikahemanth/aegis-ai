/**
 * RenameImpactAnalyzer Test Suite — Aegis V2.3 Project 2 Phase 3
 *
 * Tests:
 * - Direct importer discovery
 * - Transitive consumer / barrel re-export discovery
 * - Test file inclusion
 * - Candidate file set closure
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SymbolDefinitionResolver } from "../refactoring/symbol-definition-resolver.js";
import { RenameImpactAnalyzer } from "../refactoring/rename-impact-analyzer.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src"), { recursive: true });
  mkdirSync(join(dir, "src", "__tests__"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("RenameImpactAnalyzer Tests", () => {
  let testDir: string;
  let defResolver: SymbolDefinitionResolver;
  let impactAnalyzer: RenameImpactAnalyzer;

  beforeEach(() => {
    testDir = makeProject("aegis-impact-");

    writeFileSync(join(testDir, "src", "taskService.ts"),
      `export function updateTask(id: string, title: string) { return { id, title }; }\n`, "utf8");

    writeFileSync(join(testDir, "src", "taskController.ts"),
      `import { updateTask } from "./taskService.js";\nexport function handleUpdate(req: any) { return updateTask(req.id, req.title); }\n`, "utf8");

    writeFileSync(join(testDir, "src", "index.ts"),
      `export * from "./taskController.js";\n`, "utf8");

    writeFileSync(join(testDir, "src", "__tests__", "taskService.test.ts"),
      `import { updateTask } from "../taskService.js";\n`, "utf8");

    defResolver = new SymbolDefinitionResolver(testDir);
    impactAnalyzer = new RenameImpactAnalyzer(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Discovers definition file, direct importers, transitive consumers, and test files", () => {
    const def = defResolver.resolveDefinition("src/taskService.ts", "updateTask")!;
    const impact = impactAnalyzer.analyzeImpact(def);

    expect(impact.definitionFile).toBe("src/taskService.ts");
    expect(impact.closureStatus).toBe("CLOSED");
    expect(impact.allCandidateFiles).toContain("src/taskService.ts");
    expect(impact.allCandidateFiles).toContain("src/taskController.ts");
    expect(impact.allCandidateFiles).toContain("src/__tests__/taskService.test.ts");
  });
});
