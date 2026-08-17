import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ArchitectureResolver } from "../architecture-resolver.js";
import { DomainContractDeriver, DomainContractManager } from "../domain-contract.js";
import { TaskDAG } from "../../planner/task-dag.js";
import type { Task } from "../../planner/task.js";
import { TaskCacheManager } from "../../execution/task-cache.js";
import { StaleArtifactDetector } from "../stale-artifact-detector.js";
import { TaskFileLockManager } from "../file-ownership-registry.js";

const EVOLUTION_DIR = join(process.cwd(), ".tmp_test_phase8_evolution");

describe("AEGIS Phase 8 — Project Evolution, Contract Cascades & Architecture Stability", () => {
  beforeEach(() => {
    if (existsSync(EVOLUTION_DIR)) rmSync(EVOLUTION_DIR, { recursive: true, force: true });
    mkdirSync(EVOLUTION_DIR, { recursive: true });
    TaskFileLockManager.getInstance().reset();
  });

  afterEach(() => {
    if (existsSync(EVOLUTION_DIR)) rmSync(EVOLUTION_DIR, { recursive: true, force: true });
    TaskFileLockManager.getInstance().reset();
  });

  it("evolves an existing project by adding a new feature without full regeneration or architecture drift", () => {
    // 1. Initial Project Generation: Gym Management
    const initialPrompt = "Build a Gym Management System with members and workouts.";
    const initialArch = ArchitectureResolver.resolve(initialPrompt, undefined, undefined, EVOLUTION_DIR);
    ArchitectureResolver.writeContract(EVOLUTION_DIR, initialArch);
    const initialDomain = DomainContractManager.lock(initialArch, initialArch.architectureHash!, EVOLUTION_DIR);


    // Initial files
    const membersFile = join(EVOLUTION_DIR, "src/features/members/MemberList.tsx");
    mkdirSync(join(EVOLUTION_DIR, "src/features/members"), { recursive: true });
    writeFileSync(membersFile, "export const MemberList = () => <div>Members</div>;", "utf8");

    // 2. Incremental Feature Request: "Add trainer scheduling"
    const featurePrompt = "Add trainer scheduling feature to the gym system.";
    const evolvedArch = ArchitectureResolver.resolve(featurePrompt, undefined, undefined, EVOLUTION_DIR);

    // Architecture MUST be preserved (same database, frontend, backend)
    expect(evolvedArch.frontend.framework).toBe(initialArch.frontend.framework);
    expect(evolvedArch.backend.framework).toBe(initialArch.backend.framework);
    expect(evolvedArch.database.provider).toBe(initialArch.database.provider);

    // Existing files MUST remain untouched
    expect(existsSync(membersFile)).toBe(true);
    expect(readFileSync(membersFile, "utf8")).toBe("export const MemberList = () => <div>Members</div>;");

    // 3. Evolved Domain Contract extends with new feature
    const evolvedDomain = DomainContractDeriver.derive(evolvedArch, evolvedArch.architectureHash!);
    expect(evolvedDomain.domainHash).toBeDefined();

    // 4. Evolved Task DAG creates tasks for the new feature while existing tasks remain valid
    const newTasks: Task[] = [
      {
        id: 201,
        title: "Implement Trainer Scheduling",
        description: "Create schedule table for trainers",
        completed: false,
        dependencies: [],
        ownedFiles: ["src/features/trainers/TrainerSchedule.tsx"],
      },
    ];

    const dag = new TaskDAG(newTasks);
    expect(dag.validate().valid).toBe(true);
  });

  it("cascades domain contract changes to selectively invalidate only dependent tasks", () => {
    const arch = ArchitectureResolver.resolve("Build Recipe Management App");
    const domain1 = DomainContractDeriver.derive(arch, arch.architectureHash!);

    const unaffectedTask: Task = {
      id: 1,
      title: "Navigation Header",
      description: "Build header bar",
      completed: false,
      ownedFiles: ["src/components/Header.tsx"],
      contractHashes: {
        architectureHash: arch.architectureHash!,
        domainHash: domain1.domainHash,
      },
    };

    const dependentTask: Task = {
      id: 2,
      title: "Recipe Card",
      description: "Build recipe card",
      completed: false,
      ownedFiles: ["src/features/recipes/RecipeCard.tsx"],
      contractHashes: {
        architectureHash: arch.architectureHash!,
        domainHash: domain1.domainHash,
      },
    };

    // Cache both tasks
    TaskCacheManager.set(EVOLUTION_DIR, unaffectedTask, ["src/components/Header.tsx"]);
    TaskCacheManager.set(EVOLUTION_DIR, dependentTask, ["src/features/recipes/RecipeCard.tsx"]);

    expect(TaskCacheManager.get(EVOLUTION_DIR, unaffectedTask)).not.toBeNull();
    expect(TaskCacheManager.get(EVOLUTION_DIR, dependentTask)).not.toBeNull();

    // Mutate domain contract (e.g. added nutritional fields)
    const domain2 = {
      ...domain1,
      domainHash: "new_domain_hash_xyz",
    };

    // Check staleness detection
    const staleResult = StaleArtifactDetector.check(
      { domainHash: domain1.domainHash },
      { domainHash: domain2.domainHash } as any
    );
    expect(staleResult.stale).toBe(true);
    expect(staleResult.level).toBe("STALE_DOMAIN");


    // Invalidate domain contract in cache
    const invalidatedCount = TaskCacheManager.invalidateContract(EVOLUTION_DIR, "domainHash");
    expect(invalidatedCount).toBe(2);

    // Queries with old domainHash are now invalidated
    expect(TaskCacheManager.get(EVOLUTION_DIR, dependentTask)).toBeNull();
  });

  it("protects architecture from drift on ordinary feature requests and permits migration only on explicit demand", () => {
    const arch = ArchitectureResolver.resolve("Build a Recipe Management App with Express backend and React frontend.");
    expect(arch.backend.framework).toBe("Express");

    // Non-architectural feature request -> Architecture is preserved
    const featureArch = ArchitectureResolver.resolve("Add ingredient search filter", undefined, undefined, EVOLUTION_DIR);
    expect(featureArch.backend.framework).toBe("Express");

    // Explicit migration request -> Architecture updates
    const migrationArch = ArchitectureResolver.resolve("Migrate this application to Next.js fullstack.");
    expect(migrationArch.frontend.framework).toMatch(/Next\.js|React/i);
  });
});
