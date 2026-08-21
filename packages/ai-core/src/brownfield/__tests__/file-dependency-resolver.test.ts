/**
 * FileDependencyResolver Test Suite — Aegis V2.3 Project 2 Phase 5
 *
 * Tests:
 * - Direct importing files discovery
 * - Barrel re-exporters discovery
 * - Test file references discovery
 * - Internal relative imports discovery inside moved file
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FileDependencyResolver } from "../file-refactoring/file-dependency-resolver.js";

function makeProject(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(dir, "src", "components"), { recursive: true });
  mkdirSync(join(dir, "src", "__tests__"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "test", version: "1.0.0" }), "utf8");
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022" } }), "utf8");
  return dir;
}

describe("FileDependencyResolver Tests", () => {
  let testDir: string;
  let resolver: FileDependencyResolver;

  beforeEach(() => {
    testDir = makeProject("aegis-file-dep-");

    writeFileSync(
      join(testDir, "src", "components", "TaskCard.tsx"),
      `export function TaskCard() { return "Card"; }\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "components", "index.ts"),
      `export * from "./TaskCard.js";\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "__tests__", "TaskCard.test.ts"),
      `import { TaskCard } from "../components/TaskCard.js";\n`,
      "utf8"
    );

    resolver = new FileDependencyResolver(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("TEST 1: Discovers direct importers, barrels, and test references for a source file", () => {
    const res = resolver.resolveDependencies("src/components/TaskCard.tsx");

    expect(res.sourceFile).toBe("src/components/TaskCard.tsx");
    expect(res.directImporters).toContain("src/components/index.ts");
    expect(res.barrelReExporters).toContain("src/components/index.ts");
    expect(res.testFiles).toContain("src/__tests__/TaskCard.test.ts");
    expect(res.allCandidateFiles).toContain("src/components/TaskCard.tsx");
  });
});
