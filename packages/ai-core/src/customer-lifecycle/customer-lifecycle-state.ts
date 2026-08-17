/**
 * CustomerLifecycleStateEngine
 *
 * Tracks and transitions authoritative customer lifecycle stages and risk states.
 * Hard Invariant: CUSTOMER SIGNAL != CUSTOMER STATE. Never infer sensitive individual characteristics.
 */

export type CustomerLifecycleStage =
  | "PROSPECT"
  | "ONBOARDING"
  | "ACTIVATING"
  | "ADOPTING"
  | "ENGAGED"
  | "ESTABLISHED"
  | "EXPANDING";

export type CustomerRiskState =
  | "HEALTHY"
  | "WATCH"
  | "AT_RISK"
  | "CRITICAL"
  | "DORMANT"
  | "CHURNED";

export interface CustomerLifecycleProfile {
  customerId: string;
  projectId: string;
  tenantId: string;
  stage: CustomerLifecycleStage;
  riskState: CustomerRiskState;
  onboardingCompletionPercentage: number;
  activeWorkflowsCount: number;
  lastActiveAt: string;
  updatedAt: string;
}

export class CustomerLifecycleStateEngine {
  private static profiles: Map<string, CustomerLifecycleProfile> = new Map();

  public static registerCustomer(
    customerId: string,
    projectId: string,
    tenantId: string,
    stage: CustomerLifecycleStage = "ONBOARDING"
  ): CustomerLifecycleProfile {
    const now = new Date().toISOString();
    const profile: CustomerLifecycleProfile = {
      customerId,
      projectId,
      tenantId,
      stage,
      riskState: "HEALTHY",
      onboardingCompletionPercentage: 0,
      activeWorkflowsCount: 1,
      lastActiveAt: now,
      updatedAt: now,
    };
    this.profiles.set(customerId, profile);
    return profile;
  }

  public static transitionStage(
    customerId: string,
    newStage: CustomerLifecycleStage,
    riskState?: CustomerRiskState
  ): CustomerLifecycleProfile {
    const p = this.profiles.get(customerId);
    if (!p) throw new Error(`Customer profile ${customerId} not found.`);

    p.stage = newStage;
    if (riskState) p.riskState = riskState;
    p.updatedAt = new Date().toISOString();
    this.profiles.set(customerId, p);
    return p;
  }

  public static getProfile(customerId: string): CustomerLifecycleProfile | undefined {
    return this.profiles.get(customerId);
  }

  public static reset(): void {
    this.profiles.clear();
  }
}
