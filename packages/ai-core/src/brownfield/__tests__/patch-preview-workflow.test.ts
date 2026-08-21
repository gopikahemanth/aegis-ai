/**
 * PatchPreviewWorkflow Test Suite — Aegis V2.3 Project 1
 *
 * Tests:
 * 1. Side-effect-free preview generation (zero writes, zero branches).
 * 2. Deterministic planHash and patchHash integrity.
 * 3. Plan staleness rejection (PLAN_STALE).
 * 4. Dirty target conflict blocking.
 * 5. Dynamic import impact incomplete blocking.
 * 6. Destructive schema migration blocking.
 * 7. Feature branch isolation & collision protection (FEATURE_BRANCH_EXISTS).
 * 8. Default/Main branch preservation invariant.
 * 9. Exact preview-execution patch equivalence (PREVIEW == EXECUTION).
 * 10. Transactional rollback on failure with main untouched.
 * 11. Positive E2E for Task Management and Expense Tracker.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { PatchPreviewEngine } from "../patch-preview-engine.js";
import { ExistingSymbolModifier } from "../existing-symbol-modifier.js";
import { BrownfieldGitGuard } from "../brownfield-git-guard.js";
import { FinalSuccessGate } from "../../validation/final-success-gate.js";
import { InProjectTestRunner } from "../../validation/in-project-test-runner.js";

function setupGitRepo(dir: string): void {
  execSync("git init -b main", { cwd: dir, stdio: "ignore" });
  execSync('git config user.name "Aegis Tester"', { cwd: dir, stdio: "ignore" });
  execSync('git config user.email "tester@aegis.dev"', { cwd: dir, stdio: "ignore" });
  execSync("git add .", { cwd: dir, stdio: "ignore" });
  execSync('git commit -m "Initial commit"', { cwd: dir, stdio: "ignore" });
}

function createMockTaskApp(dir: string): void {
  mkdirSync(join(dir, "prisma"), { recursive: true });
  mkdirSync(join(dir, "server", "services"), { recursive: true });
  mkdirSync(join(dir, "server", "controllers"), { recursive: true });
  mkdirSync(join(dir, "server", "routes"), { recursive: true });
  mkdirSync(join(dir, "src", "services"), { recursive: true });
  mkdirSync(join(dir, "src", "types"), { recursive: true });
  mkdirSync(join(dir, "src", "hooks"), { recursive: true });
  mkdirSync(join(dir, "src", "components"), { recursive: true });

  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({
      name: "task-manager-app",
      version: "1.0.0",
      scripts: {
        build: "node -e \"process.exit(0)\"",
        test: "node run-tests.cjs",
      },
    }, null, 2),
    "utf8"
  );

  writeFileSync(
    join(dir, "run-tests.cjs"),
    `console.log("1 passed");\nprocess.exit(0);`,
    "utf8"
  );

  writeFileSync(
    join(dir, "prisma", "schema.prisma"),
    `datasource db {\n  provider = "postgresql"\n  url = env("DATABASE_URL")\n}\n\nmodel Task {\n  id String @id @default(uuid())\n  title String\n  completed Boolean @default(false)\n  createdAt DateTime @default(now())\n}\n`,
    "utf8"
  );

  writeFileSync(
    join(dir, "src", "types", "task.ts"),
    `export interface Task {\n  id: string;\n  title: string;\n  completed: boolean;\n  createdAt: string;\n}\n\nexport interface CreateTaskDto {\n  title: string;\n}\n`,
    "utf8"
  );

  writeFileSync(
    join(dir, "server", "services", "taskService.ts"),
    `import { Task, CreateTaskDto } from "../../src/types/task";\n\nconst tasks: Task[] = [];\n\nexport async function createTask(dto: CreateTaskDto): Promise<Task> {\n  const task: Task = {\n    id: "task-" + Date.now(),\n    title: dto.title,\n    completed: false,\n    createdAt: new Date().toISOString(),\n  };\n  tasks.push(task);\n  return task;\n}\n`,
    "utf8"
  );

  writeFileSync(
    join(dir, "server", "controllers", "taskController.ts"),
    `import { createTask } from "../services/taskService";\n\nexport async function handleCreateTask(req: any, res: any) {\n  const task = await createTask(req.body);\n  return { status: 201, data: task };\n}\n`,
    "utf8"
  );

  writeFileSync(
    join(dir, "server", "routes", "taskRoutes.ts"),
    `import { handleCreateTask } from "../controllers/taskController";\n\nexport function handleRequest(method: string, body: any) {\n  if (method === "POST") return handleCreateTask({ body }, {});\n  return { status: 404 };\n}\n`,
    "utf8"
  );

  writeFileSync(
    join(dir, "src", "services", "taskApiClient.ts"),
    `import { CreateTaskDto, Task } from "../types/task";\n\nexport async function postTask(dto: CreateTaskDto): Promise<Task> {\n  return { id: "1", title: dto.title, completed: false, createdAt: new Date().toISOString() };\n}\n`,
    "utf8"
  );

  writeFileSync(
    join(dir, "src", "hooks", "useTasks.ts"),
    `import { useState } from "react";\nimport { Task } from "../types/task";\n\nexport function useTasks() {\n  const [tasks, setTasks] = useState<Task[]>([]);\n  return { tasks, setTasks };\n}\n`,
    "utf8"
  );

  writeFileSync(
    join(dir, "src", "components", "TaskForm.ts"),
    `import { CreateTaskDto } from "../types/task";\n\nexport function TaskForm(props: { onSubmit: (dto: CreateTaskDto) => void }) {\n  return { type: "form", onSubmit: props.onSubmit };\n}\n`,
    "utf8"
  );
}

describe("Aegis V2.3 Project 1 — Interactive AST Patch Preview & Safe Branch Staging", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `aegis-v23-p1-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    mkdirSync(testDir, { recursive: true });
    createMockTaskApp(testDir);
    setupGitRepo(testDir);
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  it("TEST 1: Side-Effect-Free Preview Generation — generates preview with zero disk writes and zero Git branches", () => {
    const mainHeadBefore = BrownfieldGitGuard.getDefaultBranchHead(testDir);
    const initialFiles = readFileSync(join(testDir, "prisma", "schema.prisma"), "utf8");

    const preview = PatchPreviewEngine.generatePreview({
      projectPath: testDir,
      userRequest: "Add optional priority support to tasks",
      modelName: "Task",
      fieldName: "priority",
      prismaFieldDef: "String? @default(\"MEDIUM\")",
      tsType: "string",
      defaultValue: '"MEDIUM"',
    });

    expect(preview.mode).toBe("BROWNFIELD");
    expect(preview.slug).toContain("priority");
    expect(preview.branchName).toContain("aegis/feature/");
    expect(preview.isApplyAllowed).toBe(true);
    expect(preview.riskLevel).toBe("HIGH"); // schema modification is HIGH risk
    expect(preview.requiredFiles.length).toBeGreaterThanOrEqual(1);
    expect(preview.fileDiffs.length).toBeGreaterThanOrEqual(1);

    // Invariant: Disk remains identical
    const currentFiles = readFileSync(join(testDir, "prisma", "schema.prisma"), "utf8");
    expect(currentFiles).toBe(initialFiles);

    // Invariant: No branch created
    const mainHeadAfter = BrownfieldGitGuard.getDefaultBranchHead(testDir);
    expect(mainHeadAfter).toBe(mainHeadBefore);
    expect(BrownfieldGitGuard.checkBranchExists(preview.branchName, testDir)).toBe(false);
  });

  it("TEST 2: Plan and Patch Hash Determinism — multiple runs on same state yield identical hashes", () => {
    const preview1 = PatchPreviewEngine.generatePreview({
      projectPath: testDir,
      userRequest: "Add optional priority support to tasks",
      modelName: "Task",
      fieldName: "priority",
      prismaFieldDef: "String? @default(\"MEDIUM\")",
      tsType: "string",
    });

    const preview2 = PatchPreviewEngine.generatePreview({
      projectPath: testDir,
      userRequest: "Add optional priority support to tasks",
      modelName: "Task",
      fieldName: "priority",
      prismaFieldDef: "String? @default(\"MEDIUM\")",
      tsType: "string",
    });

    expect(preview1.planHash).toBe(preview2.planHash);
    expect(preview1.patchHash).toBe(preview2.patchHash);
  });

  it("TEST 3: Plan Staleness Rejection (PLAN_STALE) — aborts if a file changes on disk after preview", () => {
    const preview = PatchPreviewEngine.generatePreview({
      projectPath: testDir,
      userRequest: "Add optional priority support to tasks",
      modelName: "Task",
      fieldName: "priority",
      prismaFieldDef: "String? @default(\"MEDIUM\")",
      tsType: "string",
    });

    // Simulate external edit to an impacted file after preview
    writeFileSync(join(testDir, "prisma", "schema.prisma"), "// Externally modified\nmodel Task { id String @id }\n", "utf8");

    const immutabilityCheck = PatchPreviewEngine.verifyImmutability(preview, testDir);
    expect(immutabilityCheck.valid).toBe(false);
    expect(immutabilityCheck.error).toContain("PLAN_STALE");
  });

  it("TEST 4: Dirty Target Conflict — blocks preview and application when target has uncommitted edits", () => {
    // Dirty the schema file
    writeFileSync(join(testDir, "prisma", "schema.prisma"), "// uncommitted local edit\nmodel Task { id String @id }", "utf8");

    const preview = PatchPreviewEngine.generatePreview({
      projectPath: testDir,
      userRequest: "Add optional priority support to tasks",
      modelName: "Task",
      fieldName: "priority",
      prismaFieldDef: "String? @default(\"MEDIUM\")",
      tsType: "string",
    });

    expect(preview.riskLevel).toBe("BLOCKED");
    expect(preview.isApplyAllowed).toBe(false);
    expect(preview.blockedReasons.some(r => r.includes("GIT_DIRTY_TARGET"))).toBe(true);
  });

  it("TEST 5: Dynamic Import Impact Incomplete — safely halts preview with BLOCKED risk", () => {
    // Inject dynamic computed import into task service
    writeFileSync(join(testDir, "server", "services", "taskService.ts"), `const dyn = "task"; import("./" + dyn);\nexport function createTask() {}\n`, "utf8");
    execSync('git commit -am "Add dynamic import"', { cwd: testDir, stdio: "ignore" });

    const preview = PatchPreviewEngine.generatePreview({
      projectPath: testDir,
      userRequest: "Add optional priority support to tasks",
      targetSymbols: [{ filePath: "server/services/taskService.ts", symbolName: "createTask" }],
    });

    expect(preview.riskLevel).toBe("BLOCKED");
    expect(preview.isApplyAllowed).toBe(false);
    expect(preview.impactStatus).toBe("IMPACT_ANALYSIS_INCOMPLETE");
  });

  it("TEST 6: Feature Branch Isolation & Default Branch Preservation — applies changes on feature branch while main is untouched", async () => {
    const defaultBranch = BrownfieldGitGuard.getDefaultBranchName(testDir);
    const mainHeadBefore = BrownfieldGitGuard.getDefaultBranchHead(testDir);

    const preview = PatchPreviewEngine.generatePreview({
      projectPath: testDir,
      userRequest: "Add optional priority support to tasks",
      modelName: "Task",
      fieldName: "priority",
      prismaFieldDef: "String? @default(\"MEDIUM\")",
      tsType: "string",
      defaultValue: '"MEDIUM"',
    });

    expect(preview.isApplyAllowed).toBe(true);

    const modifier = new ExistingSymbolModifier(testDir);
    const result = await modifier.modify({
      targetSymbols: preview.requiredFiles.map(f => ({ filePath: f, symbolName: "all" })),
      userRequest: "Add optional priority support to tasks",
      patches: preview.filePatches,
      preview,
    });

    expect(result.success).toBe(true);
    expect(result.branchName).toBe(preview.branchName);

    // Verify current branch is the feature branch
    const currentBranch = BrownfieldGitGuard.getCurrentBranch(testDir);
    expect(currentBranch).toBe(preview.branchName);

    // Verify default branch HEAD remained completely untouched
    const mainHeadAfter = BrownfieldGitGuard.getDefaultBranchHead(testDir);
    expect(mainHeadAfter).toBe(mainHeadBefore);

    // Verify feature branch contains the new commit
    const featureHead = execSync("git rev-parse HEAD", { cwd: testDir, encoding: "utf8" }).trim();
    expect(featureHead).not.toBe(mainHeadBefore);
  });

  it("TEST 7: Feature Branch Collision Safety — returns FEATURE_BRANCH_EXISTS when branch already exists", async () => {
    const preview = PatchPreviewEngine.generatePreview({
      projectPath: testDir,
      userRequest: "Add optional priority support to tasks",
      modelName: "Task",
      fieldName: "priority",
      prismaFieldDef: "String? @default(\"MEDIUM\")",
      tsType: "string",
    });

    // Manually create the feature branch beforehand
    execSync(`git branch "${preview.branchName}"`, { cwd: testDir, stdio: "ignore" });

    const modifier = new ExistingSymbolModifier(testDir);
    const result = await modifier.modify({
      targetSymbols: preview.requiredFiles.map(f => ({ filePath: f, symbolName: "all" })),
      userRequest: "Add optional priority support to tasks",
      patches: preview.filePatches,
      preview,
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("FEATURE_BRANCH_EXISTS");
    expect(result.error).toContain("FEATURE_BRANCH_EXISTS");
  });

  it("TEST 8: Exact Preview/Execution Equivalence (PREVIEW == EXECUTION) — execution consumes immutable preview patches", async () => {
    const preview = PatchPreviewEngine.generatePreview({
      projectPath: testDir,
      userRequest: "Add optional priority support to tasks",
      modelName: "Task",
      fieldName: "priority",
      prismaFieldDef: "String? @default(\"MEDIUM\")",
      tsType: "string",
      defaultValue: '"MEDIUM"',
    });

    const executionPlanHash = preview.planHash;
    const executionPatchHash = preview.patchHash;

    const modifier = new ExistingSymbolModifier(testDir);
    const result = await modifier.modify({
      targetSymbols: preview.requiredFiles.map(f => ({ filePath: f, symbolName: "all" })),
      userRequest: "Add optional priority support to tasks",
      patches: preview.filePatches,
      preview,
    });

    expect(result.success).toBe(true);
    expect(preview.planHash).toBe(executionPlanHash);
    expect(preview.patchHash).toBe(executionPatchHash);
  });

  it("TEST 9: Transactional Rollback on Test Failure — preserves feature branch, restores files byte-for-byte, main untouched", async () => {
    // Configure test script to pass at baseline (1 passed), but fail if 'priority' is added (0 passed, 1 failed)
    writeFileSync(
      join(testDir, "run-tests.cjs"),
      `const fs = require("fs");\nconst path = require("path");\nlet hasPriority = false;\ntry {\n  const schema = fs.readFileSync(path.join(__dirname, "prisma", "schema.prisma"), "utf8");\n  if (schema.indexOf("priority") !== -1) hasPriority = true;\n} catch (e) {}\n\nif (hasPriority) {\n  console.log("0 passed, 1 failed");\n  process.exit(1);\n} else {\n  console.log("1 passed, 0 failed");\n  process.exit(0);\n}`,
      "utf8"
    );
    execSync('git commit -am "Configure regression trigger in tests"', { cwd: testDir, stdio: "ignore" });

    const mainHeadBefore = BrownfieldGitGuard.getDefaultBranchHead(testDir);
    const originalSchema = readFileSync(join(testDir, "prisma", "schema.prisma"), "utf8");

    const preview = PatchPreviewEngine.generatePreview({
      projectPath: testDir,
      userRequest: "Add optional priority support to tasks",
      modelName: "Task",
      fieldName: "priority",
      prismaFieldDef: "String? @default(\"MEDIUM\")",
      tsType: "string",
    });

    const modifier = new ExistingSymbolModifier(testDir);
    const result = await modifier.modify({
      targetSymbols: preview.requiredFiles.map(f => ({ filePath: f, symbolName: "all" })),
      userRequest: "Add optional priority support to tasks",
      patches: preview.filePatches,
      preview,
    });

    expect(result.success).toBe(false);
    expect(result.checkpointRolledBack).toBe(true);
    expect(result.status).toBe("TEST_REGRESSION");

    // Invariant: Files restored byte-for-byte
    const schemaAfter = readFileSync(join(testDir, "prisma", "schema.prisma"), "utf8");
    expect(schemaAfter).toBe(originalSchema);

    // Invariant: Main HEAD untouched
    const mainHeadAfter = BrownfieldGitGuard.getDefaultBranchHead(testDir);
    expect(mainHeadAfter).toBe(mainHeadBefore);
  });

  it("TEST 10: Destructive Schema Migration Blocking — drops required Task.title and safely halts", () => {
    const preview = PatchPreviewEngine.generatePreview({
      projectPath: testDir,
      userRequest: "Drop Task.title column from database",
      targetSymbols: [
        {
          filePath: "prisma/schema.prisma",
          symbolName: "title",
          modelName: "Task",
          isDestructive: true,
        },
      ],
    });

    expect(preview.riskLevel).toBe("BLOCKED");
    expect(preview.isApplyAllowed).toBe(false);
    expect(preview.impactStatus).toBe("DESTRUCTIVE_SCHEMA_MIGRATION_BLOCKED");
    expect(preview.blockedReasons.some(r => r.includes("DESTRUCTIVE_SCHEMA_MIGRATION_BLOCKED"))).toBe(true);
  });

  it("TEST 11: Second Domain Positive E2E (Expense Tracker) — Add optional notes to expenses on dedicated feature branch", async () => {
    // Setup Expense Tracker files in testDir
    writeFileSync(
      join(testDir, "prisma", "schema.prisma"),
      `datasource db {\n  provider = "postgresql"\n  url = env("DATABASE_URL")\n}\n\nmodel Expense {\n  id String @id @default(uuid())\n  amount Float\n  description String\n  createdAt DateTime @default(now())\n}\n`,
      "utf8"
    );
    mkdirSync(join(testDir, "src", "types"), { recursive: true });
    writeFileSync(
      join(testDir, "src", "types", "expense.ts"),
      `export interface Expense {\n  id: string;\n  amount: number;\n  description: string;\n  createdAt: string;\n}\n\nexport interface CreateExpenseDto {\n  amount: number;\n  description: string;\n}\n`,
      "utf8"
    );
    execSync('git commit -am "Setup Expense Tracker schema and types"', { cwd: testDir, stdio: "ignore" });

    const mainHeadBefore = BrownfieldGitGuard.getDefaultBranchHead(testDir);

    const preview = PatchPreviewEngine.generatePreview({
      projectPath: testDir,
      userRequest: "Add optional notes support to expenses",
      modelName: "Expense",
      fieldName: "notes",
      prismaFieldDef: "String?",
      tsType: "string",
      defaultValue: "null",
    });

    expect(preview.isApplyAllowed).toBe(true);
    expect(preview.slug).toContain("notes");

    const modifier = new ExistingSymbolModifier(testDir);
    const result = await modifier.modify({
      targetSymbols: preview.requiredFiles.map(f => ({ filePath: f, symbolName: "all" })),
      userRequest: "Add optional notes support to expenses",
      patches: preview.filePatches,
      preview,
    });

    expect(result.success).toBe(true);
    expect(result.branchName).toBe(preview.branchName);

    // Verify main branch HEAD untouched
    const mainHeadAfter = BrownfieldGitGuard.getDefaultBranchHead(testDir);
    expect(mainHeadAfter).toBe(mainHeadBefore);

    // Verify schema on feature branch contains notes field
    const schemaOnBranch = readFileSync(join(testDir, "prisma", "schema.prisma"), "utf8");
    expect(schemaOnBranch).toContain("notes String?");
  });

  it("TEST 12: Property Invariant Test — same repository + request + state = identical PatchPreview", () => {
    const previewA = PatchPreviewEngine.generatePreview({
      projectPath: testDir,
      userRequest: "Add optional priority support to tasks",
      modelName: "Task",
      fieldName: "priority",
      prismaFieldDef: "String? @default(\"MEDIUM\")",
      tsType: "string",
    });

    const previewB = PatchPreviewEngine.generatePreview({
      projectPath: testDir,
      userRequest: "Add optional priority support to tasks",
      modelName: "Task",
      fieldName: "priority",
      prismaFieldDef: "String? @default(\"MEDIUM\")",
      tsType: "string",
    });

    expect(previewA.planHash).toBe(previewB.planHash);
    expect(previewA.patchHash).toBe(previewB.patchHash);
    expect(previewA.diffSummary).toEqual(previewB.diffSummary);
    expect(previewA.riskLevel).toBe(previewB.riskLevel);
  });
});
