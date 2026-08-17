/**
 * AdoptionAuthorizationEngine
 *
 * Governs the formal, human-authorized adoption of verified innovation experiments into mainline production.
 * Hard Invariant: EXPERIMENT SUCCESS != AUTOMATIC ADOPTION.
 */

export type AdoptionAuthorizationDecision =
  | "REJECT"
  | "CONTINUE_EXPERIMENT"
  | "REQUEST_REVIEW"
  | "REQUEST_AUTHORIZATION"
  | "APPROVE_ADOPTION"
  | "BLOCK";

export interface AdoptionAuthorizationRecord {
  authorizationId: string;
  experimentId: string;
  approverId: string;
  role: string;
  decision: AdoptionAuthorizationDecision;
  signature?: string;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  expectedAnnualValueINR: number;
  authorizedAt?: string;
  summary: string;
}

export class AdoptionAuthorizationEngine {
  private static authorizations: Map<string, AdoptionAuthorizationRecord> = new Map();

  public static requestAdoption(
    experimentId: string,
    role: string = "VP_ENGINEERING",
    expectedValueINR: number = 240000
  ): AdoptionAuthorizationRecord {
    const authorizationId = `adopt_auth_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const record: AdoptionAuthorizationRecord = {
      authorizationId,
      experimentId,
      approverId: "pending_approver",
      role,
      decision: "REQUEST_AUTHORIZATION",
      riskLevel: "LOW",
      expectedAnnualValueINR: expectedValueINR,
      summary: `Adoption authorization requested for experiment ${experimentId} under role ${role}.`,
    };
    this.authorizations.set(experimentId, record);
    return record;
  }

  public static grantAdoption(
    experimentId: string,
    approverId: string,
    signature: string
  ): AdoptionAuthorizationRecord {
    const existing = this.authorizations.get(experimentId);
    const record: AdoptionAuthorizationRecord = {
      authorizationId: existing ? existing.authorizationId : `adopt_auth_${Date.now()}`,
      experimentId,
      approverId,
      role: existing ? existing.role : "VP_ENGINEERING",
      decision: "APPROVE_ADOPTION",
      signature,
      riskLevel: "LOW",
      expectedAnnualValueINR: existing ? existing.expectedAnnualValueINR : 240000,
      authorizedAt: new Date().toISOString(),
      summary: `Mainline production adoption authorized by ${approverId} (${signature}).`,
    };
    this.authorizations.set(experimentId, record);
    return record;
  }

  public static getAuthorization(experimentId: string): AdoptionAuthorizationRecord | undefined {
    return this.authorizations.get(experimentId);
  }

  public static reset(): void {
    this.authorizations.clear();
  }
}
