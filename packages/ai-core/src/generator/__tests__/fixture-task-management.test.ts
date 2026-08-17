import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ArchitectureResolver } from "../../governance/architecture-resolver.js";
import { DomainContractDeriver, DomainContractManager } from "../../governance/domain-contract.js";
import { TaskDAG } from "../../planner/task-dag.js";

import type { Task } from "../../planner/task.js";
import { ParallelScheduler } from "../../execution/parallel-scheduler.js";
import { ContractDrivenCoder } from "../contract-driven-coder.js";
import { FinalSuccessGate } from "../../validation/final-success-gate.js";
import { FeatureCompletenessTracker } from "../../governance/feature-completeness-tracker.js";

const FIXTURE_DIR = join(process.cwd(), ".tmp_fixture_task_management");

describe("End-to-End Fixture — Task Management Application Generation", () => {
  beforeEach(() => {
    if (existsSync(FIXTURE_DIR)) rmSync(FIXTURE_DIR, { recursive: true, force: true });
    mkdirSync(FIXTURE_DIR, { recursive: true });
    FeatureCompletenessTracker.reset();
  });

  afterEach(() => {
    if (existsSync(FIXTURE_DIR)) rmSync(FIXTURE_DIR, { recursive: true, force: true });
  });

  it("generates a complete, contract-consistent Task Management project through full pipeline", async () => {
    const userRequest = "Build a Task Management application with User and Task entities, React frontend, Express API, and PostgreSQL with Prisma.";

    // 1. Architecture Resolution
    const archContract = ArchitectureResolver.resolve(userRequest);
    expect(archContract.frontend.framework).toBe("React-Vite");
    expect(archContract.backend.framework).toBe("Express");
    expect(archContract.database.provider.toLowerCase()).toBe("postgresql");


    // 2. Domain Contract Derivation
    const domainContract = DomainContractManager.lock(archContract, archContract.architectureHash!, FIXTURE_DIR);
    expect(domainContract.entities.some(e => e.name.toLowerCase().includes("task") || e.name.toLowerCase().includes("user"))).toBe(true);


    // 3. Initialize Feature Completeness Tracker
    FeatureCompletenessTracker.initializeFromRequirements([
      { id: "feat_auth", name: "Authentication", description: "User login and registration" },
      { id: "feat_tasks", name: "Task CRUD", description: "Create, view, and complete tasks" },
    ]);

    // 4. Construct Task DAG
    const tasks: Task[] = [
      {
        id: 1,
        featureId: "feat_tasks",
        title: "Create Prisma Schema",
        description: "Define User and Task models in schema.prisma",
        completed: false,
        dependencies: [],
        ownedFiles: ["prisma/schema.prisma"],
      },
      {
        id: 2,
        featureId: "feat_tasks",
        title: "Implement Task API Routes",
        description: "Express router for tasks in server/routes/task.routes.ts",
        completed: false,
        dependencies: [1],
        ownedFiles: ["server/routes/task.routes.ts"],
        requiredExports: ["taskRouter"],
      },
      {
        id: 3,
        featureId: "feat_tasks",
        title: "Implement Frontend Task Component",
        description: "React component for task list in src/features/tasks/TaskList.tsx",
        completed: false,
        dependencies: [],
        ownedFiles: ["src/features/tasks/TaskList.tsx"],
        requiredExports: ["TaskList"],
      },
    ];

    const dag = new TaskDAG(tasks);
    const dagValidation = dag.validate();
    expect(dagValidation.valid).toBe(true);

    // 5. Execute Tasks via ParallelScheduler + ContractDrivenCoder
    const scheduler = new ParallelScheduler({ maxConcurrentAgents: 2 });

    const schedulerResult = await scheduler.execute(
      dag,
      async (task) => {
        // Deterministic generator simulating code output per task
        const generatorFn = async () => {
          if (task.id === 1) {
            return JSON.stringify({
              status: "SUCCESS",
              taskId: 1,
              changedFiles: [
                {
                  path: "prisma/schema.prisma",
                  content: `datasource db {\n  provider = "postgresql"\n  url = env("DATABASE_URL")\n}\n\nmodel User {\n  id Int @id @default(autoincrement())\n  email String @unique\n  name String?\n}\n\nmodel Task {\n  id Int @id @default(autoincrement())\n  title String\n  completed Boolean @default(false)\n  userId Int?\n  user User? @relation(fields: [userId], references: [id])\n}`,
                },
              ],
            });
          }
          if (task.id === 2) {
            return JSON.stringify({
              status: "SUCCESS",
              taskId: 2,
              changedFiles: [
                {
                  path: "server/routes/task.routes.ts",
                  content: `export const taskRouter = (req: any, res: any) => res.json({ tasks: [] });`,
                },
              ],
            });
          }
          if (task.id === 3) {
            return JSON.stringify({
              status: "SUCCESS",
              taskId: 3,
              changedFiles: [
                {
                  path: "src/features/tasks/TaskList.tsx",
                  content: `import React from "react";\nexport const TaskList = () => <div><h2>Tasks</h2></div>;`,
                },
              ],
            });
          }
          return JSON.stringify({ status: "FAILED", taskId: task.id, changedFiles: [] });
        };

        const coderResult = await ContractDrivenCoder.executeTask(
          task,
          FIXTURE_DIR,
          generatorFn,
          { archContract, domainContract }
        );

        return {
          success: coderResult.success,
          outputFiles: coderResult.outputFiles,
          tokensIn: coderResult.tokensIn,
          tokensOut: coderResult.tokensOut,
          error: coderResult.error,
        };
      },
      { projectPath: FIXTURE_DIR }
    );

    expect(schedulerResult.success).toBe(true);
    expect(schedulerResult.metrics.tasksPassed).toBe(3);

    // Verify all files written to disk
    expect(existsSync(join(FIXTURE_DIR, "prisma/schema.prisma"))).toBe(true);
    expect(existsSync(join(FIXTURE_DIR, "server/routes/task.routes.ts"))).toBe(true);
    expect(existsSync(join(FIXTURE_DIR, "src/features/tasks/TaskList.tsx"))).toBe(true);

    // 6. Record Verification Evidence & Verify FinalSuccessGate
    const gateEvaluation = FinalSuccessGate.verify({
      projectRoot: FIXTURE_DIR,
      contract: archContract,
      buildSuccess: true,
      serverReady: true,
      browserResult: { passed: true, renderedElementsCount: 15, routesChecked: ["/"] } as any,
      apiReport: { passed: true, summary: "2/2 API tests passed" } as any,
      realityResult: { passed: true, violationCount: 0 } as any,
    });

    expect(gateEvaluation.status).toBe("SUCCESS");
    expect(gateEvaluation.success).toBe(true);
  });
});


