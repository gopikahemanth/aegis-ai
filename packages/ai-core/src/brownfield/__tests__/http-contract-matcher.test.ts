/**
 * HttpContractMatcher Test Suite — Aegis V2.3 Project 2 Phase 7.2
 *
 * Tests:
 * - Matching server routes with client consumers
 */

import { describe, it, expect } from "vitest";
import { HttpContractMatcher } from "../runtime-contract/http/http-contract-matcher.js";
import type { HttpEndpointNode, HttpClientEndpointNode } from "../runtime-contract/http/http-contract-model.js";

describe("HttpContractMatcher Tests", () => {
  it("TEST 1: Matches server endpoint with canonicalized client consumer", () => {
    const endpoint: HttpEndpointNode = {
      endpointId: "GET /api/tasks/:id",
      method: "GET",
      path: "/:id",
      normalizedPath: "/api/tasks/:id",
      filePath: "src/routes/taskRoutes.ts",
      mountPrefix: "/api/tasks",
      startPos: 0,
      endPos: 100,
    };

    const clients: HttpClientEndpointNode[] = [
      {
        clientId: "GET /api/tasks/:id",
        method: "GET",
        rawUrl: "`/api/tasks/${id}`",
        normalizedPath: "/api/tasks/:id",
        filePath: "src/api/taskClient.ts",
        callType: "fetch",
        startPos: 10,
        endPos: 50,
      },
    ];

    const res = HttpContractMatcher.match(endpoint, clients);
    expect(res.isMatched).toBe(true);
    expect(res.clientConsumers.length).toBe(1);
    expect(res.clientConsumers[0].filePath).toBe("src/api/taskClient.ts");
  });
});
