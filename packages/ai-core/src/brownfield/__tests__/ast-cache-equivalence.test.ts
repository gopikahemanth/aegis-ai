/**
 * AST Cache Cold/Warm Equivalence Test Suite — Aegis V2.3 Project 2 Phase 1
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { PatchPreviewEngine } from "../patch-preview-engine.js";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";
import { ImpactClosureEngine } from "../impact-closure-engine.js";

describe("Aegis V2.3 Project 2 Phase 1 — Cold vs Warm Cache Equivalence", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "aegis-ast-cache-equiv-"));
    mkdirSync(join(testDir, "prisma"), { recursive: true });
    mkdirSync(join(testDir, "src", "types"), { recursive: true });
    mkdirSync(join(testDir, "src", "services"), { recursive: true });
    mkdirSync(join(testDir, "src", "components"), { recursive: true });
    mkdirSync(join(testDir, "server", "services"), { recursive: true });

    writeFileSync(
      join(testDir, "package.json"),
      JSON.stringify({ name: "mock-task-app", version: "1.0.0", dependencies: { react: "^18.0.0" } }, null, 2),
      "utf8"
    );

    writeFileSync(
      join(testDir, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { target: "ES2022", baseUrl: "." } }, null, 2),
      "utf8"
    );

    writeFileSync(
      join(testDir, "prisma", "schema.prisma"),
      `datasource db {\n  provider = "postgresql"\n  url = env("DATABASE_URL")\n}\n\nmodel Task {\n  id String @id @default(uuid())\n  title String\n  completed Boolean @default(false)\n  createdAt DateTime @default(now())\n}\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "types", "task.ts"),
      `export interface Task {\n  id: string;\n  title: string;\n  completed: boolean;\n  createdAt: string;\n}\n\nexport interface CreateTaskDto {\n  title: string;\n}\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "server", "services", "taskService.ts"),
      `import { Task, CreateTaskDto } from "../../src/types/task.js";\n\nexport async function createTask(dto: CreateTaskDto): Promise<Task> {\n  return { id: "1", title: dto.title, completed: false, createdAt: new Date().toISOString() };\n}\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "services", "taskApiClient.ts"),
      `import { Task, CreateTaskDto } from "../types/task.js";\n\nexport async function apiCreateTask(dto: CreateTaskDto): Promise<Task> {\n  return { id: "1", title: dto.title, completed: false, createdAt: "" };\n}\n`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src", "components", "TaskForm.tsx"),
      `import React from "react";\nimport { CreateTaskDto } from "../types/task.js";\n\nexport const TaskForm: React.FC = () => { return <div>Task Form</div>; };\n`,
      "utf8"
    );

    execSync("git init -b main", { cwd: testDir, stdio: "ignore" });
    execSync('git config user.name "Aegis"', { cwd: testDir, stdio: "ignore" });
    execSync('git config user.email "aegis@test.local"', { cwd: testDir, stdio: "ignore" });
    execSync("git add .", { cwd: testDir, stdio: "ignore" });
    execSync('git commit -m "Initial commit"', { cwd: testDir, stdio: "ignore" });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try {
        rmSync(testDir, { recursive: true, force: true });
      } catch {}
    }
  });

  it("TEST 1: Cold analysis vs Warm analysis produces identical normalized symbols and closures", () => {
    // 1. Cold Scan Pass
    const coldResolver = new SymbolReferenceResolver(testDir);
    const coldSummaries = coldResolver.parseProject({ bypassCache: true });

    const coldClosureEngine = new ImpactClosureEngine(testDir);
    const coldClosure = coldClosureEngine.computeClosure([
      { filePath: "src/types/task.ts", symbolName: "Task" },
    ]);

    // 2. Warm Cache Pass
    const warmResolver = new SymbolReferenceResolver(testDir);
    const warmSummaries = warmResolver.parseProject();

    const warmClosureEngine = new ImpactClosureEngine(testDir);
    const warmClosure = warmClosureEngine.computeClosure([
      { filePath: "src/types/task.ts", symbolName: "Task" },
    ]);

    // Verify Summaries Parity
    expect(Array.from(warmSummaries.keys()).sort()).toEqual(Array.from(coldSummaries.keys()).sort());
    for (const file of coldSummaries.keys()) {
      const coldFile = coldSummaries.get(file)!;
      const warmFile = warmSummaries.get(file)!;

      const coldSyms = coldFile.symbols.map(s => s.name).sort();
      const warmSyms = warmFile.symbols.map(s => s.name).sort();
      expect(warmSyms).toEqual(coldSyms);

      const coldImps = coldFile.imports.map(i => i.sourceModuleSpecifier).sort();
      const warmImps = warmFile.imports.map(i => i.sourceModuleSpecifier).sort();
      expect(warmImps).toEqual(coldImps);
    }

    // Verify Impact Closures Parity
    expect(warmClosure.status).toBe(coldClosure.status);
    expect(warmClosure.mustChange.sort()).toEqual(coldClosure.mustChange.sort());
    expect(warmClosure.mayChange.sort()).toEqual(coldClosure.mayChange.sort());
  });

  it("TEST 2: Cold vs Warm PatchPreview generates exact same planHash and patchHash", () => {
    // 1. First run generates cache
    const previewCold = PatchPreviewEngine.generatePreview({
      projectPath: testDir,
      userRequest: "Add optional priority support to tasks",
      modelName: "Task",
      fieldName: "priority",
      prismaFieldDef: "String? @default(\"MEDIUM\")",
      tsType: "string",
    });

    // 2. Second run leverages warm cache
    const previewWarm = PatchPreviewEngine.generatePreview({
      projectPath: testDir,
      userRequest: "Add optional priority support to tasks",
      modelName: "Task",
      fieldName: "priority",
      prismaFieldDef: "String? @default(\"MEDIUM\")",
      tsType: "string",
    });

    expect(previewWarm.planHash).toBe(previewCold.planHash);
    expect(previewWarm.patchHash).toBe(previewCold.patchHash);
    expect(previewWarm.riskLevel).toBe(previewCold.riskLevel);
    expect(previewWarm.diffSummary).toEqual(previewCold.diffSummary);
  });
});
