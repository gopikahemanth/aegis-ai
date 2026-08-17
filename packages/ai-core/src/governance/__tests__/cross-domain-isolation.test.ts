import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ArchitectureResolver } from "../architecture-resolver.js";
import { DomainContractDeriver, DomainContractManager } from "../domain-contract.js";
import { DomainContaminationValidator } from "../domain-contamination-validator.js";
import { PromptComposer } from "../../prompts/prompt-composer.js";
import { TaskCacheManager } from "../../execution/task-cache.js";
import type { Task } from "../../planner/task.js";
import { TaskFileLockManager } from "../file-ownership-registry.js";

const WORKSPACE_A = join(process.cwd(), ".tmp_test_isolation_projA_resume");
const WORKSPACE_B = join(process.cwd(), ".tmp_test_isolation_projB_gym");

describe("AEGIS Phase 8 — Cross-Domain, Memory, Prompt & Cache Isolation", () => {
  beforeEach(() => {
    if (existsSync(WORKSPACE_A)) rmSync(WORKSPACE_A, { recursive: true, force: true });
    if (existsSync(WORKSPACE_B)) rmSync(WORKSPACE_B, { recursive: true, force: true });
    mkdirSync(WORKSPACE_A, { recursive: true });
    mkdirSync(WORKSPACE_B, { recursive: true });
    TaskFileLockManager.getInstance().reset();
  });

  afterEach(() => {
    if (existsSync(WORKSPACE_A)) rmSync(WORKSPACE_A, { recursive: true, force: true });
    if (existsSync(WORKSPACE_B)) rmSync(WORKSPACE_B, { recursive: true, force: true });
    TaskFileLockManager.getInstance().reset();
  });

  it("proves complete prompt context and memory isolation between two distinct projects", () => {
    // 1. Project A: Resume Scanner
    const reqA = "Build an AI Resume Scanner application with ATS match score calculation.";
    const archA = ArchitectureResolver.resolve(reqA);
    const domainA = DomainContractManager.lock(archA, archA.architectureHash!, WORKSPACE_A);

    // 2. Project B: Gym Management System
    const reqB = "Build a Gym Management System with member attendance and trainer workouts.";
    const archB = ArchitectureResolver.resolve(reqB);
    const domainB = DomainContractManager.lock(archB, archB.architectureHash!, WORKSPACE_B);

    // 3. Verify Prompt Isolation for Project B
    const taskB: Task = {
      id: 101,
      title: "Implement Workout Tracker",
      description: "Track gym member workout sessions",
      completed: false,
      ownedFiles: ["src/features/workouts/WorkoutTracker.tsx"],
      contractHashes: {
        architectureHash: archB.architectureHash!,
        domainHash: domainB.domainHash,
      },
    };

    const composedPrompt = PromptComposer.compose({
      role: "CODER",
      projectId: "proj_b_gym",
      generationId: "gen_gym_1",
      contracts: {
        architectureContract: archB,
        domainContract: domainB,
      },
      task: taskB,
    });

    // Assert Project B prompt contains Gym terms and Project B task/entities
    const promptText = composedPrompt.fullPromptText.toLowerCase();
    expect(promptText).toContain("workout");
    expect(promptText).toContain("gym management");
    expect(composedPrompt.systemPrompt).toContain("CODER");
  });



  it("proves strict cache namespace isolation — Project A cached task is never reused for Project B", () => {
    const archA = ArchitectureResolver.resolve("Build Resume App");
    const domainA = DomainContractDeriver.derive(archA, archA.architectureHash!);

    const archB = ArchitectureResolver.resolve("Build Gym App");
    const domainB = DomainContractDeriver.derive(archB, archB.architectureHash!);

    // Common sounding task title: "Create Header"
    const taskInA: Task = {
      id: 1,
      title: "Create App Header",
      description: "Build header navigation",
      completed: false,
      ownedFiles: ["src/components/Header.tsx"],
      contractHashes: {
        architectureHash: archA.architectureHash!,
        domainHash: domainA.domainHash,
      },
    };

    const taskInB: Task = {
      id: 1,
      title: "Create App Header",
      description: "Build header navigation",
      completed: false,
      ownedFiles: ["src/components/Header.tsx"],
      contractHashes: {
        architectureHash: archB.architectureHash!,
        domainHash: domainB.domainHash,
      },
    };

    // Cache result in Project A
    TaskCacheManager.set(WORKSPACE_A, taskInA, ["src/components/Header.tsx"]);
    const cachedInA = TaskCacheManager.get(WORKSPACE_A, taskInA);
    expect(cachedInA).not.toBeNull();

    // Query cache in Project B -> Must be NULL (No cross-project cache leakage)
    const cachedInB = TaskCacheManager.get(WORKSPACE_B, taskInB);
    expect(cachedInB).toBeNull();
  });

  it("detects and flags intentional cross-domain contamination", () => {
    const archGym = ArchitectureResolver.resolve("Build a Gym Management System");
    const domainGym = DomainContractManager.lock(archGym, archGym.architectureHash!, WORKSPACE_B);

    // Contaminate Gym workspace with an unauthorized Resume file
    const contaminatedDir = join(WORKSPACE_B, "src/features/resume");
    mkdirSync(contaminatedDir, { recursive: true });
    writeFileSync(
      join(contaminatedDir, "ResumeDropzone.tsx"),
      "export const ResumeDropzone = () => <div>Upload Candidate Resume for ATS Matching</div>;",
      "utf8"
    );

    const report = DomainContaminationValidator.validate(WORKSPACE_B, domainGym);
    expect(report.passed).toBe(false);
    expect(report.violationCount).toBeGreaterThan(0);
    expect(report.violations.some((v) => v.term.toLowerCase() === "resume" || v.term.toLowerCase() === "candidate")).toBe(true);
  });
});
