/**
 * HttpContractDiffEngine Test Suite — Aegis V2.3 Project 2 Phase 7.2
 *
 * Tests:
 * - Route rename diff computation
 * - HTTP method change diff computation
 */

import { describe, it, expect } from "vitest";
import { HttpContractDiffEngine } from "../runtime-contract/http/http-contract-diff-engine.js";
import type { HttpEndpointNode } from "../runtime-contract/http/http-contract-model.js";

describe("HttpContractDiffEngine Tests", () => {
  const endpoint: HttpEndpointNode = {
    endpointId: "GET /api/expenses",
    method: "GET",
    path: "/api/expenses",
    normalizedPath: "/api/expenses",
    filePath: "src/server.ts",
    startPos: 0,
    endPos: 50,
  };

  it("TEST 1: Computes ROUTE_RENAME diff", () => {
    const diffs = HttpContractDiffEngine.computeDiff(endpoint, "GET", "/api/expense-records");

    expect(diffs.length).toBe(1);
    expect(diffs[0].type).toBe("ROUTE_RENAME");
    expect(diffs[0].oldPath).toBe("/api/expenses");
    expect(diffs[0].newPath).toBe("/api/expense-records");
  });

  it("TEST 2: Computes METHOD_CHANGE diff", () => {
    const diffs = HttpContractDiffEngine.computeDiff(endpoint, "POST", "/api/expenses");

    expect(diffs.length).toBe(1);
    expect(diffs[0].type).toBe("METHOD_CHANGE");
    expect(diffs[0].oldMethod).toBe("GET");
    expect(diffs[0].newMethod).toBe("POST");
  });
});
