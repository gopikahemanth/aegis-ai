/**
 * ProductionState Model & Deterministic State Machine
 *
 * Tracks the authoritative production operational state per project & environment.
 */

export type EnvironmentType = "development" | "test" | "staging" | "canary" | "production";

export type DeploymentLifecycleStatus =
  | "IDLE"
  | "PREPARING"
  | "VALIDATING"
  | "AWAITING_AUTHORIZATION"
  | "DEPLOYING"
  | "HEALTH_CHECKING"
  | "SMOKE_TESTING"
  | "CANARY_ANALYSIS"
  | "PROMOTING"
  | "COMPLETED"
  | "FAILED"
  | "ROLLED_BACK";

export type ProductionHealthStatus = "HEALTHY" | "DEGRADED" | "UNAVAILABLE" | "UNKNOWN";

export interface ProductionState {
  projectId: string;
  environment: EnvironmentType;
  currentReleaseId?: string;
  currentGenerationId?: string;
  activeDeploymentStatus: DeploymentLifecycleStatus;
  healthStatus: ProductionHealthStatus;
  activeIncidentsCount: number;
  lastUpdated: string;
  locked: boolean;
}

export class ProductionStateManager {
  private static states: Map<string, ProductionState> = new Map(); // key = `${projectId}:${environment}`

  private static getKey(projectId: string, environment: EnvironmentType): string {
    return `${projectId}:${environment}`;
  }

  /**
   * Get or initialize production state for a project and environment.
   */
  public static getState(projectId: string, environment: EnvironmentType = "production"): ProductionState {
    const key = this.getKey(projectId, environment);
    let state = this.states.get(key);
    if (!state) {
      state = {
        projectId,
        environment,
        activeDeploymentStatus: "IDLE",
        healthStatus: "UNKNOWN",
        activeIncidentsCount: 0,
        lastUpdated: new Date().toISOString(),
        locked: false,
      };
      this.states.set(key, state);
    }
    return state;
  }

  /**
   * Update production state with deterministic transition validation.
   */
  public static updateState(
    projectId: string,
    environment: EnvironmentType,
    updates: Partial<ProductionState>
  ): ProductionState {
    const state = this.getState(projectId, environment);

    if (state.locked && updates.activeDeploymentStatus && updates.activeDeploymentStatus !== "COMPLETED" && updates.activeDeploymentStatus !== "ROLLED_BACK" && updates.activeDeploymentStatus !== "FAILED") {
      throw new Error(`PRODUCTION_STATE_LOCKED: Environment "${environment}" for project "${projectId}" is locked by active deployment.`);
    }

    Object.assign(state, updates, { lastUpdated: new Date().toISOString() });
    return state;
  }

  public static reset(): void {
    this.states.clear();
  }
}
