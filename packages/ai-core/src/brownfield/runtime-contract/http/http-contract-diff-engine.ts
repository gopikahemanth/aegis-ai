/**
 * HttpContractDiffEngine — Aegis V2.3 Project 2 Phase 7.2
 *
 * Computes diffs between current and proposed HTTP route endpoints.
 */

import type { HttpEndpointNode, HttpVerb } from "./http-contract-model.js";

export interface HttpEndpointDiff {
  type: "ROUTE_RENAME" | "METHOD_CHANGE" | "PARAM_CHANGE";
  oldMethod: HttpVerb;
  newMethod: HttpVerb;
  oldPath: string;
  newPath: string;
}

export class HttpContractDiffEngine {
  /**
   * Computes structural diff between endpoint and requested change.
   */
  public static computeDiff(
    endpoint: HttpEndpointNode,
    newMethod?: HttpVerb,
    newPath?: string
  ): HttpEndpointDiff[] {
    const diffs: HttpEndpointDiff[] = [];

    const targetMethod = newMethod || endpoint.method;
    const targetPath = newPath || endpoint.normalizedPath;

    if (targetMethod !== endpoint.method) {
      diffs.push({
        type: "METHOD_CHANGE",
        oldMethod: endpoint.method,
        newMethod: targetMethod,
        oldPath: endpoint.normalizedPath,
        newPath: targetPath,
      });
    }

    if (targetPath !== endpoint.normalizedPath) {
      diffs.push({
        type: "ROUTE_RENAME",
        oldMethod: endpoint.method,
        newMethod: targetMethod,
        oldPath: endpoint.normalizedPath,
        newPath: targetPath,
      });
    }

    return diffs;
  }
}
