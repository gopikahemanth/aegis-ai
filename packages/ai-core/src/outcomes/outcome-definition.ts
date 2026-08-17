/**
 * BusinessOutcomeDefinition
 *
 * Canonical model for strategic business outcomes linking initiatives to measurable metrics.
 */

export interface BusinessOutcome {
  outcomeId: string;
  initiativeId: string;
  organizationId: string;
  name: string;
  metric: string;
  baselineValue: number;
  targetValue: number;
  currentValue?: number;
  measurementUnit: string;
  deadline: string;
  status: "ON_TRACK" | "AT_RISK" | "OFF_TRACK" | "ACHIEVED" | "PARTIALLY_ACHIEVED" | "FAILED" | "REGRESSED" | "INSUFFICIENT_EVIDENCE";
}

export class OutcomeDefinitionManager {
  private static outcomes: Map<string, BusinessOutcome> = new Map();

  public static defineOutcome(outcome: Omit<BusinessOutcome, "status"> & { status?: BusinessOutcome["status"] }): BusinessOutcome {
    const full: BusinessOutcome = {
      ...outcome,
      status: outcome.status || "ON_TRACK",
    };
    this.outcomes.set(outcome.outcomeId, full);
    return full;
  }

  public static getOutcome(outcomeId: string): BusinessOutcome | undefined {
    return this.outcomes.get(outcomeId);
  }

  public static listOutcomes(organizationId?: string): BusinessOutcome[] {
    if (organizationId) {
      return Array.from(this.outcomes.values()).filter((o) => o.organizationId === organizationId);
    }
    return Array.from(this.outcomes.values());
  }

  public static reset(): void {
    this.outcomes.clear();
  }
}
