import { describe, it, expect, beforeEach, afterEach } from "vitest";
import http from "node:http";
import { GoldenWorkflowRegistry } from "../golden-workflow-registry.js";
import { RuntimeProcessManager } from "../../execution/runtime-process-manager.js";

describe("GoldenWorkflowRegistry", () => {
  beforeEach(() => {
    GoldenWorkflowRegistry.clear();
  });

  afterEach(() => {
    GoldenWorkflowRegistry.clear();
  });

  it("registers golden workflows and verifies regressions against live server", async () => {
    const port = await RuntimeProcessManager.allocateFreePort();

    const server = http.createServer((req, res) => {
      const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
      res.setHeader("Content-Type", "application/json");

      if (url.pathname === "/api/members" && req.method === "GET") {
        res.writeHead(200);
        res.end(JSON.stringify({ members: [{ id: 1, name: "Alice" }] }));
        return;
      }
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Not found" }));
    });

    await new Promise<void>((resolve) => server.listen(port, "127.0.0.1", resolve));

    try {
      const baseUrl = `http://127.0.0.1:${port}`;

      GoldenWorkflowRegistry.registerWorkflow({
        id: "gwf_list_members",
        name: "List Members Golden Workflow",
        description: "Fetch all active gym members",
        targetFeature: "members",
        apiSteps: [
          {
            workflowId: "step_get_members",
            operationId: "getMembers",
            method: "GET",
            path: "/api/members",
            expectedStatus: 200,
            expectedFields: ["members"],
            description: "List members",
          },
        ],
      });

      const regressionReport = await GoldenWorkflowRegistry.executeRegression(baseUrl);
      expect(regressionReport.passed).toBe(true);
      expect(regressionReport.passedCount).toBe(1);
      expect(regressionReport.failedCount).toBe(0);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
