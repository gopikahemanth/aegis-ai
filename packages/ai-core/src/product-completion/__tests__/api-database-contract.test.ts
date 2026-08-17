import { describe, it, expect } from "vitest";
import { ApiDatabaseContractVerifier } from "../api-database-contract-verifier.js";

describe("AEGIS Phase 45 — API & Database Contract Verifier", () => {
  it("verifies consistency between frontend endpoints, backend routing, and database models", () => {
    const fe = [
      { method: "GET" as const, path: "/api/members", expectedStatus: 200 },
      { method: "POST" as const, path: "/api/members", expectedStatus: 201 },
    ];
    const be = [
      { method: "GET" as const, path: "/api/members", expectedStatus: 200 },
      { method: "POST" as const, path: "/api/members", expectedStatus: 201 },
    ];
    const models = ["Member", "Attendance"];

    const report = ApiDatabaseContractVerifier.verifyContracts(fe, be, models);
    expect(report.isConsistent).toBe(true);
    expect(report.matchingEndpointsCount).toBe(2);
    expect(report.schemaModelsChecked).toBe(2);
  });
});
