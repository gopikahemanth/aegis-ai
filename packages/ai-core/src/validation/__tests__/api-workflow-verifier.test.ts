/**
 * api-workflow-verifier.test.ts
 *
 * Tests contract-driven API workflow step generation (positive, negative, auth, schemas).
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ApiContractRegistry } from "../../governance/api-contract-registry.js";
import { ApiWorkflowVerifier } from "../api-workflow-verifier.js";

describe("ApiWorkflowVerifier — Workflow Generation & Contract Testing", () => {
  beforeEach(() => {
    ApiContractRegistry.registerContract([
      {
        operationId: "createScan",
        method: "POST",
        path: "/api/scans",
        description: "Initiate repository vulnerability scan",
        authentication: true,
        requestSchema: [
          { name: "repoUrl", type: "string", required: true },
          { name: "branch", type: "string", required: false },
        ],
        responseSchema: [
          { name: "scanId", type: "string", required: true },
          { name: "status", type: "string", required: true },
        ],
        featureOwnership: "security-scan",
      },
      {
        operationId: "getScanHistory",
        method: "GET",
        path: "/api/scans/history",
        description: "List previous scans",
        authentication: true,
        responseSchema: [
          { name: "scans", type: "Scan[]", required: true },
        ],
        featureOwnership: "security-scan",
      },
      {
        operationId: "healthCheck",
        method: "GET",
        path: "/api/health",
        description: "Public health check",
        authentication: false,
        responseSchema: [
          { name: "status", type: "string", required: true },
        ],
      }
    ]);
  });

  it("generates positive, negative auth, and negative bad request workflow steps", () => {
    const steps = ApiWorkflowVerifier.generateWorkflowsFromContract();

    // Expect:
    // createScan: 1 pos + 1 neg_auth + 1 neg_badreq = 3
    // getScanHistory: 1 pos + 1 neg_auth = 2
    // healthCheck: 1 pos (no auth, no body) = 1
    // Total = 6
    expect(steps.length).toBe(6);

    const posCreate = steps.find(s => s.workflowId === "wf_pos_createScan");
    expect(posCreate).toBeDefined();
    expect(posCreate?.method).toBe("POST");
    expect(posCreate?.path).toBe("/api/scans");
    expect(posCreate?.expectedStatus).toBe(201);
    expect(posCreate?.headers?.Authorization).toBe("Bearer test_token");
    expect(posCreate?.requestBody).toHaveProperty("repoUrl");
    expect(posCreate?.expectedFields).toContain("scanId");

    const negAuthCreate = steps.find(s => s.workflowId === "wf_neg_auth_createScan");
    expect(negAuthCreate).toBeDefined();
    expect(negAuthCreate?.expectedStatus).toBe(401);
    expect(negAuthCreate?.isNegativeTest).toBe(true);

    const healthCheck = steps.find(s => s.workflowId === "wf_pos_healthCheck");
    expect(healthCheck).toBeDefined();
    expect(healthCheck?.headers?.Authorization).toBeUndefined(); // no auth required
  });
});
