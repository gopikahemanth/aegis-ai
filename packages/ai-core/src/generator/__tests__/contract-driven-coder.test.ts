import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ContractDrivenCoder } from "../contract-driven-coder.js";
import { ArchitectureResolver } from "../../governance/architecture-resolver.js";
import { DomainContractDeriver } from "../../governance/domain-contract.js";
import type { Task } from "../../planner/task.js";
import { TaskFileLockManager } from "../../governance/file-ownership-registry.js";

const TEST_DIR = join(process.cwd(), ".tmp_test_coder_phase7");

describe("ContractDrivenCoder — Governance, Validation & Transactional Safety", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DIR, { recursive: true });
    TaskFileLockManager.getInstance().reset();
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
    TaskFileLockManager.getInstance().reset();
  });

  // 1. Successful task execution with valid TypeScript and required export
  it("successfully executes task, validates output, and commits changes", async () => {
    const arch = ArchitectureResolver.resolve("Build a React Express app with PostgreSQL.");
    const domain = DomainContractDeriver.derive(arch, arch.architectureHash!);

    const task: Task = {
      id: 1,
      title: "Implement Task List View",
      description: "Render tasks in a clean list",
      completed: false,
      ownedFiles: ["src/features/tasks/TaskList.tsx"],
      requiredExports: ["TaskList"],
      acceptanceCriteria: [{ description: "Must export TaskList component" }],
    };

    const mockGenerator = async () => JSON.stringify({
      status: "SUCCESS",
      taskId: 1,
      changedFiles: [
        {
          path: "src/features/tasks/TaskList.tsx",
          content: "import React from 'react';\nexport const TaskList = () => <div>Task List</div>;\nexport default TaskList;",
        },
      ],
    });

    const result = await ContractDrivenCoder.executeTask(task, TEST_DIR, mockGenerator, {
      archContract: arch,
      domainContract: domain,
    });

    expect(result.success).toBe(true);
    expect(result.changedFiles).toContain("src/features/tasks/TaskList.tsx");
    expect(existsSync(join(TEST_DIR, "src/features/tasks/TaskList.tsx"))).toBe(true);
  });

  // 2. Semantic duplicate detection (ScoreRadar.tsx rejected when ScoreGauge.tsx is canonical)
  it("rejects semantic duplicate files (ScoreRadar.tsx)", async () => {
    const arch = ArchitectureResolver.resolve("Build a React Express app with PostgreSQL.");
    const domain = DomainContractDeriver.derive(arch, arch.architectureHash!);

    const task: Task = {
      id: 2,
      title: "Implement Score Radar Chart",
      description: "Create score visualizer",
      completed: false,
      ownedFiles: ["src/features/scoring/ScoreRadar.tsx"],
    };

    const mockGenerator = async () => JSON.stringify({
      status: "SUCCESS",
      taskId: 2,
      changedFiles: [
        {
          path: "src/features/scoring/ScoreRadar.tsx",
          content: "export const ScoreRadar = () => <div/>;",
        },
      ],
    });

    const result = await ContractDrivenCoder.executeTask(task, TEST_DIR, mockGenerator, {
      archContract: arch,
      domainContract: domain,
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/SEMANTIC_DUPLICATE_ERROR|unauthorized duplicate|orphan/i);
    expect(existsSync(join(TEST_DIR, "src/features/scoring/ScoreRadar.tsx"))).toBe(false);

  });

  // 3. Missing required export detection
  it("rejects file and rolls back if required export is missing", async () => {
    const arch = ArchitectureResolver.resolve("Build a React Express app with PostgreSQL.");
    const domain = DomainContractDeriver.derive(arch, arch.architectureHash!);

    const task: Task = {
      id: 3,
      title: "Implement Task Service",
      description: "Service for tasks",
      completed: false,
      ownedFiles: ["src/features/tasks/taskService.ts"],
      requiredExports: ["createTask"], // Required export
    };

    const mockGenerator = async () => JSON.stringify({
      status: "SUCCESS",
      taskId: 3,
      changedFiles: [
        {
          path: "src/features/tasks/taskService.ts",
          content: "export const getTasks = () => [];", // Forgot createTask!
        },
      ],
    });

    const result = await ContractDrivenCoder.executeTask(task, TEST_DIR, mockGenerator, {
      archContract: arch,
      domainContract: domain,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("IMPORT_EXPORT_VIOLATION");
    expect(result.error).toContain("MISSING_EXPORT");
    expect(existsSync(join(TEST_DIR, "src/features/tasks/taskService.ts"))).toBe(false);

  });

  // 4. Server/Client boundary violation (@prisma/client in frontend)
  it("rejects frontend file importing @prisma/client and rolls back", async () => {
    const arch = ArchitectureResolver.resolve("Build a React Express app with PostgreSQL.");
    const domain = DomainContractDeriver.derive(arch, arch.architectureHash!);

    const task: Task = {
      id: 4,
      title: "Implement Task Component with direct DB",
      description: "Direct DB query",
      completed: false,
      ownedFiles: ["src/features/tasks/TaskItem.tsx"],
    };

    const mockGenerator = async () => JSON.stringify({
      status: "SUCCESS",
      taskId: 4,
      changedFiles: [
        {
          path: "src/features/tasks/TaskItem.tsx",
          content: "import { PrismaClient } from '@prisma/client';\nexport const TaskItem = () => <div/>;",
        },
      ],
    });

    const result = await ContractDrivenCoder.executeTask(task, TEST_DIR, mockGenerator, {
      archContract: arch,
      domainContract: domain,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("SERVER_CLIENT_BOUNDARY_VIOLATION");
    expect(existsSync(join(TEST_DIR, "src/features/tasks/TaskItem.tsx"))).toBe(false);
  });

  // 5. Fake button handler detection (console.log-only)
  it("rejects fake placeholder console.log button handler", async () => {
    const arch = ArchitectureResolver.resolve("Build a React Express app with PostgreSQL.");
    const domain = DomainContractDeriver.derive(arch, arch.architectureHash!);

    const task: Task = {
      id: 5,
      title: "Implement Create Task Button",
      description: "Add create task button",
      completed: false,
      ownedFiles: ["src/features/tasks/CreateTaskButton.tsx"],
    };

    const mockGenerator = async () => JSON.stringify({
      status: "SUCCESS",
      taskId: 5,
      changedFiles: [
        {
          path: "src/features/tasks/CreateTaskButton.tsx",
          content: "export const CreateTaskButton = () => <button onClick={() => console.log('Created task')}>Create</button>;",
        },
      ],
    });

    const result = await ContractDrivenCoder.executeTask(task, TEST_DIR, mockGenerator, {
      archContract: arch,
      domainContract: domain,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("FAKE_FEATURE_ERROR");
  });
});
