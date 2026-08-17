/**
 * FeatureAuthorizationEngine
 *
 * Enforces human-in-the-loop and policy authorization boundaries for candidate features.
 * Invariant: REQUIREMENT ≠ AUTHORIZATION
 * Invariant: UNAUTHORIZED FEATURE → DO NOT IMPLEMENT
 */

import { FeatureContract } from "./feature-contract-engine.js";

export type AuthorizationDecision =
  | "AUTHORIZED"
  | "REQUIRES_HUMAN_APPROVAL"
  | "AUTO_AUTHORIZED"
  | "BLOCKED"
  | "REJECTED";

export interface AuthorizationResult {
  contractId: string;
  decision: AuthorizationDecision;
  isPermittedToImplement: boolean;
  authorizer: string;
  justification: string;
  authorizedAt?: string;
}

export class FeatureAuthorizationEngine {
  public static evaluateAuthorization(
    contract: FeatureContract,
    opts: {
      userExplicitlyApproved?: boolean;
      isBlockedBySecurity?: boolean;
    } = {}
  ): AuthorizationResult {
    const { userExplicitlyApproved = true, isBlockedBySecurity = false } = opts;

    if (isBlockedBySecurity) {
      return {
        contractId: contract.contractId,
        decision: "BLOCKED",
        isPermittedToImplement: false,
        authorizer: "AEGIS Security Compliance Gate",
        justification: "Authorization DENIED: Unresolved security policy conflict detected.",
      };
    }

    if (!userExplicitlyApproved) {
      return {
        contractId: contract.contractId,
        decision: "REQUIRES_HUMAN_APPROVAL",
        isPermittedToImplement: false,
        authorizer: "Pending User Adjudication",
        justification: "Feature introducing new data export surface requires explicit human owner approval.",
      };
    }

    return {
      contractId: contract.contractId,
      decision: "AUTHORIZED",
      isPermittedToImplement: true,
      authorizer: "Authorized Product Owner",
      justification: "Explicit product owner approval granted for Member Data Bulk Export.",
      authorizedAt: new Date().toISOString(),
    };
  }
}
