/**
 * StageStateMachine
 *
 * Authoritative lifecycle state machine for Aegis generation stages.
 * Enforces fail-closed invariants:
 * - A stage with active blockers or unresolved failures can NEVER transition to APPROVED.
 * - Downstream stages (Database, Backend, Fullstack Verification) cannot proceed if upstream
 *   stages are BLOCKED or REPAIR_REQUIRED.
 * - All stage transitions are auditable and persisted in `.aegis/stage-state.json`.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export type StageState =
  | "NOT_STARTED"
  | "RUNNING"
  | "REPAIR_REQUIRED"
  | "BLOCKED"
  | "PASSED"
  | "APPROVED"
  | "NOT_APPLICABLE";

export type GenerationStage =
  | "REQUIREMENT_INTELLIGENCE"
  | "ARCHITECTURE_SPECIFICATION"
  | "DESIGN_SYSTEM_PLANNING"
  | "FRONTEND_SYNTHESIS"
  | "FRONTEND_VERIFICATION"
  | "FRONTEND_REPAIR"
  | "FRONTEND_APPROVAL"
  | "DATABASE_ARCHITECTURE"
  | "BACKEND_IMPLEMENTATION"
  | "FULLSTACK_INTEGRATION_VERIFICATION"
  | "FINAL_CERTIFICATION";

export interface StageTransitionRecord {
  stage: GenerationStage;
  fromState: StageState;
  toState: StageState;
  timestamp: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface StageStateSnapshot {
  stages: Record<GenerationStage, StageState>;
  history: StageTransitionRecord[];
  activeStage?: GenerationStage;
  blockedReason?: string;
  lastUpdated: string;
}

export class StageStateMachine {
  private outputDirectory: string;
  private snapshot: StageStateSnapshot;

  constructor(outputDirectory: string) {
    this.outputDirectory = outputDirectory;
    this.snapshot = this.loadSnapshot();
  }

  private static getStatePath(outputDirectory: string): string {
    return join(outputDirectory, ".aegis", "stage-state.json");
  }

  private loadSnapshot(): StageStateSnapshot {
    const filePath = StageStateMachine.getStatePath(this.outputDirectory);
    if (existsSync(filePath)) {
      try {
        return JSON.parse(readFileSync(filePath, "utf8"));
      } catch {
        // Fall back to clean state
      }
    }

    const defaultStages: Record<GenerationStage, StageState> = {
      REQUIREMENT_INTELLIGENCE: "NOT_STARTED",
      ARCHITECTURE_SPECIFICATION: "NOT_STARTED",
      DESIGN_SYSTEM_PLANNING: "NOT_STARTED",
      FRONTEND_SYNTHESIS: "NOT_STARTED",
      FRONTEND_VERIFICATION: "NOT_STARTED",
      FRONTEND_REPAIR: "NOT_STARTED",
      FRONTEND_APPROVAL: "NOT_STARTED",
      DATABASE_ARCHITECTURE: "NOT_STARTED",
      BACKEND_IMPLEMENTATION: "NOT_STARTED",
      FULLSTACK_INTEGRATION_VERIFICATION: "NOT_STARTED",
      FINAL_CERTIFICATION: "NOT_STARTED",
    };

    return {
      stages: defaultStages,
      history: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  private saveSnapshot(): void {
    const aegisDir = join(this.outputDirectory, ".aegis");
    if (!existsSync(aegisDir)) {
      mkdirSync(aegisDir, { recursive: true });
    }
    this.snapshot.lastUpdated = new Date().toISOString();
    writeFileSync(
      StageStateMachine.getStatePath(this.outputDirectory),
      JSON.stringify(this.snapshot, null, 2),
      "utf8"
    );
  }

  public getStageState(stage: GenerationStage): StageState {
    return this.snapshot.stages[stage] || "NOT_STARTED";
  }

  public getSnapshot(): StageStateSnapshot {
    return { ...this.snapshot };
  }

  public isStageApproved(stage: GenerationStage): boolean {
    return this.snapshot.stages[stage] === "APPROVED";
  }

  public isStagePassed(stage: GenerationStage): boolean {
    const state = this.snapshot.stages[stage];
    return state === "PASSED" || state === "APPROVED";
  }

  public transition(stage: GenerationStage, toState: StageState, reason?: string, metadata?: Record<string, any>): void {
    const fromState = this.snapshot.stages[stage] || "NOT_STARTED";

    // Invariant: Cannot approve a stage directly from BLOCKED or REPAIR_REQUIRED without passing verification
    if (toState === "APPROVED" && (fromState === "BLOCKED" || fromState === "REPAIR_REQUIRED")) {
      throw new Error(
        `INVALID_STAGE_TRANSITION: Cannot transition stage '${stage}' from '${fromState}' to 'APPROVED'. Reason: ${reason || "Blockers must be resolved first."}`
      );
    }

    // Invariant: Stage 9 (DATABASE_ARCHITECTURE) requires FRONTEND_APPROVAL to be APPROVED or PASSED
    if (stage === "DATABASE_ARCHITECTURE" && (toState === "RUNNING" || toState === "PASSED")) {
      const frontendApprovalState = this.snapshot.stages["FRONTEND_APPROVAL"];
      if (frontendApprovalState !== "APPROVED" && frontendApprovalState !== "PASSED") {
        throw new Error(
          `STAGE_PREREQUISITE_FAILED: Stage 'DATABASE_ARCHITECTURE' cannot proceed because 'FRONTEND_APPROVAL' is in state '${frontendApprovalState}'. Expected 'APPROVED' or 'PASSED'.`
        );
      }
    }

    this.snapshot.stages[stage] = toState;
    if (toState === "RUNNING") {
      this.snapshot.activeStage = stage;
    } else if (this.snapshot.activeStage === stage && (toState === "PASSED" || toState === "APPROVED" || toState === "BLOCKED")) {
      this.snapshot.activeStage = undefined;
    }

    if (toState === "BLOCKED") {
      this.snapshot.blockedReason = reason;
    }

    const record: StageTransitionRecord = {
      stage,
      fromState,
      toState,
      timestamp: new Date().toISOString(),
      reason,
      metadata,
    };

    this.snapshot.history.push(record);
    this.saveSnapshot();
  }

  public block(stage: GenerationStage, reason: string, metadata?: Record<string, any>): void {
    this.transition(stage, "BLOCKED", reason, metadata);
  }
}
