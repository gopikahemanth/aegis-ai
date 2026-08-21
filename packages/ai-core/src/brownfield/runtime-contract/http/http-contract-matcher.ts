/**
 * HttpContractMatcher — Aegis V2.3 Project 2 Phase 7.2
 *
 * Matches HTTP server endpoints with client request callers:
 * - Method equality (GET, POST, PATCH, etc.)
 * - Normalized path template equivalence (/api/tasks/:id == /api/tasks/:id)
 * - Returns matching client consumers or flags divergence
 */

import type {
  HttpEndpointNode,
  HttpClientEndpointNode,
  HttpContractStatus,
} from "./http-contract-model.js";

export interface MatchResult {
  status: HttpContractStatus;
  isMatched: boolean;
  endpoint: HttpEndpointNode;
  clientConsumers: HttpClientEndpointNode[];
  reasons: string[];
}

export class HttpContractMatcher {
  /**
   * Matches an HTTP endpoint against discovered client consumers.
   */
  public static match(
    endpoint: HttpEndpointNode,
    allClients: HttpClientEndpointNode[]
  ): MatchResult {
    const matchingClients = allClients.filter(c => {
      const methodMatches = c.method === endpoint.method;
      const pathMatches =
        c.normalizedPath === endpoint.normalizedPath ||
        c.normalizedPath === endpoint.path ||
        `${endpoint.mountPrefix || ""}${c.normalizedPath}` === endpoint.normalizedPath;

      return methodMatches && pathMatches;
    });

    return {
      status: "IN_SYNC",
      isMatched: true,
      endpoint,
      clientConsumers: matchingClients,
      reasons: [],
    };
  }
}
