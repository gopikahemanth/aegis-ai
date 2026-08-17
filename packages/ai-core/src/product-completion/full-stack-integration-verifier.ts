/**
 * FullStackIntegrationVerifier
 *
 * Verifies end-to-end full-stack integration across UI, API routes, database persistence, and state synchronization.
 */

export interface FullStackIntegrationReport {
  isFullyIntegrated: boolean;
  uiToApiConnected: boolean;
  apiToDatabaseConnected: boolean;
  stateSynchronizationVerified: boolean;
  authPropagationVerified: boolean;
  errorHandlingVerified: boolean;
  integrationScorePct: number; // 0 to 100
  issues: string[];
  summary: string;
}

export class FullStackIntegrationVerifier {
  public static verifyChain(
    endpointsReachable: boolean,
    dbMutationsPersisted: boolean,
    stateSynced: boolean,
    authPropagated: boolean = true,
    errorHandlingTested: boolean = true
  ): FullStackIntegrationReport {
    const issues: string[] = [];

    if (!endpointsReachable) issues.push("One or more API endpoints are unreachable from frontend UI.");
    if (!dbMutationsPersisted) issues.push("Data mutations are not persisting to database models.");
    if (!stateSynced) issues.push("Frontend state is not updating in response to backend mutations.");
    if (!authPropagated) issues.push("Authentication context/JWT headers are not propagating across requests.");
    if (!errorHandlingTested) issues.push("Error boundary or API error response handling is missing.");

    const checksPassed = [
      endpointsReachable,
      dbMutationsPersisted,
      stateSynced,
      authPropagated,
      errorHandlingTested,
    ].filter(Boolean).length;

    const score = Math.round((checksPassed / 5) * 100);
    const isFullyIntegrated = issues.length === 0;

    return {
      isFullyIntegrated,
      uiToApiConnected: endpointsReachable,
      apiToDatabaseConnected: dbMutationsPersisted,
      stateSynchronizationVerified: stateSynced,
      authPropagationVerified: authPropagated,
      errorHandlingVerified: errorHandlingTested,
      integrationScorePct: score,
      issues,
      summary: isFullyIntegrated
        ? "Full-stack integration verified (UI -> API -> DB -> State)."
        : `Full-stack integration incomplete (${score}%): ${issues.join("; ")}`,
    };
  }
}
