/**
 * CanonicalGenerationPlan & CanonicalPlanManager
 *
 * Implements Fix 6: Single Authoritative Canonical Planning Pipeline.
 *
 * Invariant:
 * ONE authoritative planning phase -> ONE canonical immutable plan -> Coder DAG.
 * Downstream stages consume the locked plan rather than re-interpreting the prompt.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { ArchitectureContractV1 } from "../governance/architecture-resolver.js";
import type { Task } from "../planner/task.js";

export interface LockedGenerationPlan {
  planId: string;
  planHash: string;
  request: string;
  enrichedRequest: string;
  framework: string;
  architectureContract: ArchitectureContractV1;
  specification: any;
  canonicalSpec: any;
  dataArchitecture?: any;
  tasks: Task[];
  inferredLibraries: string[];
  inferredFeatureNames: string[];
  activeTeam?: Array<{ role: string; description: string }>;
  createdAt: string;
}

export class CanonicalPlanManager {
  /**
   * Computes a deterministic SHA256 identity for a canonical plan.
   */
  public static computePlanHash(
    architectureContract: ArchitectureContractV1,
    tasks: Task[],
    specification?: any
  ): string {
    const payload = JSON.stringify({
      archHash: architectureContract.architectureHash || "arch_default",
      frontend: architectureContract.frontend.framework,
      backend: architectureContract.backend.framework,
      database: architectureContract.database.provider,
      orm: architectureContract.database.orm,
      auth: architectureContract.authentication,
      models: (architectureContract.requiredModels || []).slice().sort(),
      features: (architectureContract.requiredFeatures || []).slice().sort(),
      taskIds: tasks.map(t => `${t.id}:${t.title}`).sort(),
      routes: specification?.routing || [],
    });

    return createHash("sha256").update(payload).digest("hex").slice(0, 16);
  }

  /**
   * Constructs an immutable canonical generation plan.
   */
  public static create(params: {
    request: string;
    enrichedRequest: string;
    framework: string;
    architectureContract: ArchitectureContractV1;
    specification: any;
    canonicalSpec: any;
    dataArchitecture?: any;
    tasks: Task[];
    inferredLibraries?: string[];
    inferredFeatureNames?: string[];
    activeTeam?: Array<{ role: string; description: string }>;
  }): LockedGenerationPlan {
    const planHash = this.computePlanHash(
      params.architectureContract,
      params.tasks,
      params.specification
    );

    const plan: LockedGenerationPlan = {
      planId: `plan_${Date.now()}_${planHash.slice(0, 6)}`,
      planHash,
      request: params.request,
      enrichedRequest: params.enrichedRequest,
      framework: params.framework,
      architectureContract: params.architectureContract,
      specification: params.specification,
      canonicalSpec: params.canonicalSpec,
      dataArchitecture: params.dataArchitecture,
      tasks: params.tasks,
      inferredLibraries: params.inferredLibraries || [],
      inferredFeatureNames: params.inferredFeatureNames || [],
      activeTeam: params.activeTeam,
      createdAt: new Date().toISOString(),
    };

    return Object.freeze(plan);
  }

  /**
   * Persists a locked generation plan to disk.
   */
  public static save(projectRoot: string, plan: LockedGenerationPlan): void {
    const aegisDir = join(projectRoot, ".aegis");
    if (!existsSync(aegisDir)) {
      mkdirSync(aegisDir, { recursive: true });
    }
    writeFileSync(
      join(aegisDir, "locked-generation-plan.json"),
      JSON.stringify(plan, null, 2),
      "utf8"
    );
  }

  /**
   * Loads and returns the locked generation plan from disk if present.
   */
  public static load(projectRoot: string): LockedGenerationPlan | null {
    const planPath = join(projectRoot, ".aegis", "locked-generation-plan.json");
    if (!existsSync(planPath)) return null;

    try {
      const raw = JSON.parse(readFileSync(planPath, "utf8"));
      return Object.freeze(raw) as LockedGenerationPlan;
    } catch {
      return null;
    }
  }

  /**
   * Verifies that downstream task execution conforms to the locked plan hash.
   */
  public static verifyPlanIntegrity(
    plan: LockedGenerationPlan,
    currentContract: ArchitectureContractV1,
    currentTasks: Task[]
  ): { valid: boolean; currentHash: string; expectedHash: string } {
    const currentHash = this.computePlanHash(
      currentContract,
      currentTasks,
      plan.specification
    );
    return {
      valid: currentHash === plan.planHash,
      currentHash,
      expectedHash: plan.planHash,
    };
  }
}
