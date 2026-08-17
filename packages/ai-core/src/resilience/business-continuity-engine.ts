/**
 * BusinessContinuityEngine
 *
 * Models business capability resilience, fallback strategies, and maximum tolerable downtime.
 */

export interface BusinessCapabilityContinuity {
  capabilityId: string;
  name: string;
  criticality: "TIER_1_MISSION_CRITICAL" | "TIER_2_BUSINESS_CRITICAL" | "TIER_3_OPERATIONAL";
  dependentProjects: string[];
  fallbackStrategy: string;
  continuityStatus: "FULLY_RESILIENT" | "RESILIENT" | "DEGRADED" | "AT_RISK" | "UNPROTECTED";
}

export class BusinessContinuityEngine {
  private static capabilities: Map<string, BusinessCapabilityContinuity> = new Map();

  public static registerCapability(cap: BusinessCapabilityContinuity): void {
    this.capabilities.set(cap.capabilityId, cap);
  }

  public static getCapability(capabilityId: string): BusinessCapabilityContinuity | undefined {
    return this.capabilities.get(capabilityId);
  }

  public static listCapabilities(): BusinessCapabilityContinuity[] {
    return Array.from(this.capabilities.values());
  }

  public static reset(): void {
    this.capabilities.clear();
  }
}
