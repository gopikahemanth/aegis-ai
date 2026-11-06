import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ImplementationRunner } from "../implementation-runner.js";
import { ExecutionStage } from "../stage.js";
import type { TaskContext } from "../task-context.js";
import type { ExecutionTask } from "../execution-loop.js";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("ImplementationRunner Artifact Validation & Status Correctness", () => {
  let testDir: string;
  let runner: ImplementationRunner;

  beforeEach(() => {
    testDir = join(tmpdir(), `aegis-task-val-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    mkdirSync(testDir, { recursive: true });
    runner = new ImplementationRunner();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try {
        rmSync(testDir, { recursive: true, force: true });
      } catch {}
    }
  });

  it("proves that a task in ExecutionStage.Implementation CANNOT report success without producing or validating required artifacts", async () => {
    const task: ExecutionTask = {
      id: 101,
      title: "Implement Navigation Component",
      stage: ExecutionStage.Implementation,
      ownedFiles: ["src/components/Navigation.tsx"],
    } as any;

    const context: TaskContext = {
      request: "Create nav",
      outputDirectory: testDir,
      currentStage: ExecutionStage.Implementation,
    };

    // The required file 'src/components/Navigation.tsx' does NOT exist on disk
    const result = await runner.run(context, task);

    expect(result.success).toBe(false);
    expect(result.message).toContain("Required artifacts (src/components/Navigation.tsx) were not produced or validated on disk");
  });

  it("proves that a task succeeds in ExecutionStage.Implementation when its required artifacts exist on disk and are non-empty", async () => {
    const relFile = "src/components/Navigation.tsx";
    const fullPath = join(testDir, relFile);
    mkdirSync(join(testDir, "src", "components"), { recursive: true });
    writeFileSync(fullPath, "export function Navigation() { return <nav>FinTrack</nav>; }", "utf8");

    const task: ExecutionTask = {
      id: 102,
      title: "Implement Navigation Component",
      stage: ExecutionStage.Implementation,
      ownedFiles: [relFile],
    } as any;

    const context: TaskContext = {
      request: "Create nav",
      outputDirectory: testDir,
      currentStage: ExecutionStage.Implementation,
    };

    const result = await runner.run(context, task);

    expect(result.success).toBe(true);
    expect(result.message).toContain("Implementation completed and required artifacts verified");
  });

  it("proves that empty files (0 bytes) do NOT satisfy implementation verification", async () => {
    const relFile = "src/components/Empty.tsx";
    const fullPath = join(testDir, relFile);
    mkdirSync(join(testDir, "src", "components"), { recursive: true });
    writeFileSync(fullPath, "", "utf8"); // 0 bytes

    const task: ExecutionTask = {
      id: 103,
      title: "Implement Empty Component",
      stage: ExecutionStage.Implementation,
      ownedFiles: [relFile],
    } as any;

    const context: TaskContext = {
      request: "Create empty",
      outputDirectory: testDir,
      currentStage: ExecutionStage.Implementation,
    };

    const result = await runner.run(context, task);

    expect(result.success).toBe(false);
    expect(result.message).toContain("were not produced or validated on disk");
  });

  it("proves that ExecutionStage.Planning accurately reports planned/staged status without claiming false implementation completion", async () => {
    const task: ExecutionTask = {
      id: 104,
      title: "Plan Database Schema",
      stage: ExecutionStage.Planning,
      ownedFiles: ["prisma/schema.prisma"],
    } as any;

    const context: TaskContext = {
      request: "Plan project",
      outputDirectory: testDir,
      currentStage: ExecutionStage.Planning,
    };

    const result = await runner.run(context, task);

    expect(result.success).toBe(true);
    expect(result.message).toContain("Planning stage verified: task registered in execution graph");
    expect(result.message).not.toContain("Implementation completed");
  });
});
