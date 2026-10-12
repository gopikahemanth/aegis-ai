import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ApiWorkflowVerifier, ApiWorkflowReport, ApiWorkflowStep } from "../api-workflow-verifier.js";
import { FinalSuccessGate } from "../final-success-gate.js";
import http from "node:http";

describe("API & Database Persistence Verification Regressions", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "aegis-api-db-reg-"));
    mkdirSync(join(tempDir, ".aegis"), { recursive: true });
    mkdirSync(join(tempDir, "src"), { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it("REG-API-01: executeWorkflows executes stateful steps, confirms read-back, and writes evidence", async () => {
    // Spin up a mock HTTP server responding to stateful POST and GET read-back
    let createdItem: any = null;
    const server = http.createServer((req, res) => {
      if (req.method === "POST" && req.url === "/api/assets") {
        let body = "";
        req.on("data", chunk => (body += chunk));
        req.on("end", () => {
          createdItem = { id: 1, name: "Solar Inverter 100kW" };
          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(JSON.stringify(createdItem));
        });
      } else if (req.method === "GET" && req.url === "/api/assets/1") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(createdItem || { id: 1 }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", () => resolve()));
    const port = (server.address() as any).port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      const steps: ApiWorkflowStep[] = [
        {
          workflowId: "wf_pos_createAsset",
          operationId: "createAsset",
          method: "POST",
          path: "/api/assets",
          endpointType: "STATEFUL",
          requiresDbMutation: true,
          readBackPath: "/api/assets/1",
          expectedStatus: 201,
          requestBody: { name: "Solar Inverter 100kW" },
          description: "Create new renewable energy asset",
        },
      ];

      const report = await ApiWorkflowVerifier.executeWorkflows(baseUrl, steps, tempDir);

      expect(report.passed).toBe(true);
      expect(report.mutationsVerified).toBe(1);
      expect(report.statefulEndpointsTested).toBe(1);
      expect(report.postgresVerified).toBe(true);

      // Verify .aegis/api-workflow-report.json and .aegis/api-workflow-evidence.json were created
      const reportPath = join(tempDir, ".aegis", "api-workflow-report.json");
      const evidencePath = join(tempDir, ".aegis", "api-workflow-evidence.json");

      expect(existsSync(reportPath)).toBe(true);
      expect(existsSync(evidencePath)).toBe(true);

      const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));
      expect(evidence.status).toBe("VERIFIED");
      expect(evidence.mutationsVerified).toBe(1);
      expect(evidence.postgresVerified).toBe(true);
    } finally {
      server.close();
    }
  });

  it("REG-API-02: FinalSuccessGate enforces API & DB Persistence check", () => {
    // 1. When API report has failures, FinalSuccessGate must fail
    const failingApiReport: ApiWorkflowReport = {
      passed: false,
      totalSteps: 2,
      passedSteps: 1,
      failedSteps: 1,
      readOnlyEndpointsTested: 1,
      statefulEndpointsTested: 1,
      mutationsVerified: 0,
      validationTestsPassed: 0,
      http500Count: 1,
      coverageRatio: 0.5,
      results: [],
      summary: "API Verification failed: 1 HTTP 500 error",
    };

    const failResult = FinalSuccessGate.verify({
      projectRoot: tempDir,
      contract: null,
      buildSuccess: true,
      apiReport: failingApiReport,
    });

    expect(failResult.success).toBe(false);
    expect(failResult.status).toBe("FAILED");
    const apiItem = failResult.items.find(i => i.category === "API");
    expect(apiItem).toBeDefined();
    expect(apiItem?.passed).toBe(false);

    // 2. When API report passed with verified mutations, check must pass
    const passingApiReport: ApiWorkflowReport = {
      passed: true,
      totalSteps: 2,
      passedSteps: 2,
      failedSteps: 0,
      readOnlyEndpointsTested: 1,
      statefulEndpointsTested: 1,
      mutationsVerified: 1,
      validationTestsPassed: 0,
      http500Count: 0,
      coverageRatio: 1.0,
      postgresVerified: true,
      results: [],
      summary: "API Workflow Verification: 2/2 passed. Stateful Mutations: 1/1.",
    };

    const passResult = FinalSuccessGate.verify({
      projectRoot: tempDir,
      contract: null,
      buildSuccess: true,
      apiReport: passingApiReport,
    });

    const passItem = passResult.items.find(i => i.category === "API");
    expect(passItem).toBeDefined();
    expect(passItem?.passed).toBe(true);
  });
});
