import { describe, it, expect } from "vitest";
import { ApiCompatibilityValidator } from "../api-compatibility-validator.js";
import type { ApiEndpointContract } from "../../governance/api-contract-registry.js";

describe("ApiCompatibilityValidator", () => {
  const v1Endpoints: ApiEndpointContract[] = [
    {
      featureOwnership: "members",
      operationId: "getMembers",
      method: "GET",
      path: "/api/members",
      authentication: false,
      authorizationRoles: [],
      requestSchema: [],
      responseSchema: [{ name: "members", type: "array", required: true }],
      statusCodes: [200],
      description: "List members",
    },
    {
      featureOwnership: "members",
      operationId: "createMember",
      method: "POST",
      path: "/api/members",
      authentication: false,
      authorizationRoles: [],
      requestSchema: [{ name: "name", type: "string", required: true }],
      responseSchema: [{ name: "id", type: "number", required: true }],
      statusCodes: [201],
      description: "Create member",
    },
  ];

  it("classifies added endpoints and optional fields as NON_BREAKING_CHANGE", () => {
    const v2Compatible: ApiEndpointContract[] = [
      ...v1Endpoints,
      {
        featureOwnership: "members",
        operationId: "getMemberById",
        method: "GET",
        path: "/api/members/:id",
        authentication: false,
        authorizationRoles: [],
        requestSchema: [],
        responseSchema: [],
        statusCodes: [200],
        description: "Get single member",
      },
    ];

    const report = ApiCompatibilityValidator.validate(v1Endpoints, v2Compatible);
    expect(report.isBackwardCompatible).toBe(true);
    expect(report.classification).toBe("NON_BREAKING_CHANGE");
    expect(report.addedEndpoints.length).toBe(1);
  });

  it("classifies removed endpoint or added auth as BREAKING_CHANGE", () => {
    const v2Breaking: ApiEndpointContract[] = [
      {
        ...v1Endpoints[0],
        authentication: true, // Breaking: required auth on previously public endpoint
      },
      // v1Endpoints[1] removed! (Breaking)
    ];

    const report = ApiCompatibilityValidator.validate(v1Endpoints, v2Breaking);
    expect(report.isBackwardCompatible).toBe(false);
    expect(report.classification).toBe("BREAKING_CHANGE");
    expect(report.breakingChanges.length).toBeGreaterThan(0);
  });
});
