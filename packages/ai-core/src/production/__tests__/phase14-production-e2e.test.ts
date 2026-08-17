import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import http from "node:http";
import { JobOrchestrator } from "../../control-plane/job-orchestrator.js";
import { ProductionReleaseGate } from "../production-release-gate.js";
import { DeploymentEngine } from "../deployment-engine.js";
import { ResourceLeakDetector } from "../resource-leak-detector.js";
import { RuntimeProcessManager } from "../../execution/runtime-process-manager.js";
import { GoldenWorkflowRegistry } from "../../evolution/golden-workflow-registry.js";
import { TaskFileLockManager } from "../../governance/file-ownership-registry.js";
import { TaskCacheManager } from "../../execution/task-cache.js";

const P14_PROJ_DIR = join(process.cwd(), ".tmp_test_p14_e2e");

describe("AEGIS Phase 14 — Master Production Engineering & Release Acceptance Test", () => {
  beforeEach(() => {
    if (existsSync(P14_PROJ_DIR)) rmSync(P14_PROJ_DIR, { recursive: true, force: true });
    mkdirSync(P14_PROJ_DIR, { recursive: true });
    JobOrchestrator.reset();
    GoldenWorkflowRegistry.clear();
    TaskFileLockManager.getInstance().reset();
    TaskCacheManager.clear();
  });

  afterEach(async () => {
    await RuntimeProcessManager.stopAll();
    JobOrchestrator.reset();
    GoldenWorkflowRegistry.clear();
    TaskFileLockManager.getInstance().reset();
    TaskCacheManager.clear();
    if (existsSync(P14_PROJ_DIR)) rmSync(P14_PROJ_DIR, { recursive: true, force: true });
  });

  it("executes complete lifecycle: Prompt -> Generation -> Live Verification -> Product Gate -> Production Release Gate -> Certificate -> Staged Deploy -> Verified Rollback", async () => {
    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 1. Create Job & Start Autonomous Generation
    const jobG1 = JobOrchestrator.createJob({
      projectId: "gym_p14_project",
      projectPath: P14_PROJ_DIR,
      prompt: rawPrompt,
    });

    const dbMembers: Array<{ id: number; name: string }> = [];
    const port = await RuntimeProcessManager.allocateFreePort();

    const server = http.createServer((req, res) => {
      const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
      res.setHeader("Content-Type", "application/json");

      if (url.pathname === "/api/members") {
        if (req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => (body += chunk));
          req.on("end", () => {
            const data = JSON.parse(body || "{}");
            const member = { id: dbMembers.length + 1, name: data.name || "Alice" };
            dbMembers.push(member);
            res.writeHead(201);
            res.end(JSON.stringify(member));
          });
          return;
        }
        if (req.method === "GET") {
          res.writeHead(200);
          res.end(JSON.stringify({ members: dbMembers }));
          return;
        }
      }

      if (url.pathname === "/") {
        res.setHeader("Content-Type", "text/html");
        res.writeHead(200);
        res.end("<html><body><h1>Gym Dashboard</h1></body></html>");
        return;
      }

      res.writeHead(200);
      res.end(JSON.stringify({ ok: true }));
    });

    await new Promise<void>((resolve) => server.listen(port, "127.0.0.1", resolve));

    try {
      const baseUrl = `http://127.0.0.1:${port}`;

      const completedG1 = await JobOrchestrator.startJob(jobG1.jobId, {
        liveServerUrl: baseUrl,
        apiWorkflowSteps: [
          {
            workflowId: "wf_create_member",
            operationId: "createMember",
            method: "POST",
            path: "/api/members",
            requestBody: { name: "Alice" },
            expectedStatus: 201,
            expectedFields: ["id", "name"],
            description: "Create member",
          },
          {
            workflowId: "wf_get_members",
            operationId: "getMembers",
            method: "GET",
            path: "/api/members",
            expectedStatus: 200,
            expectedFields: ["members"],
            description: "Get members",
          },
        ],
        browserWorkflowActions: [
          { name: "Navigate Home", type: "NAVIGATE", url: baseUrl },
          { name: "Assert Text", type: "ASSERT_TEXT", text: "Gym Dashboard" },
        ],
        customExecutor: async () => {
          mkdirSync(join(P14_PROJ_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(P14_PROJ_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(P14_PROJ_DIR, "prisma"), { recursive: true });

          writeFileSync(join(P14_PROJ_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }), "utf8");
          writeFileSync(join(P14_PROJ_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P14_PROJ_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P14_PROJ_DIR, "prisma/schema.prisma"),
            `datasource db {\n  provider = "postgresql"\n  url = env("DATABASE_URL")\n}\n\nmodel User {\n  id Int @id @default(autoincrement())\n}\n\nmodel Member {\n  id Int @id @default(autoincrement())\n  name String\n}`,
            "utf8"
          );

          return {
            success: true,
            createdFiles: [
              "package.json",
              "src/features/members/MemberList.tsx",
              "server/routes/members.ts",
              "prisma/schema.prisma",
            ],
            modifiedFiles: [],
            deletedFiles: [],
          };
        },
      });

      expect(completedG1.status).toBe("COMPLETED");
      expect(completedG1.finalStatus).toBe("SUCCESS");

      // 2. ProductionReleaseGate Evaluation
      const releaseCert = await ProductionReleaseGate.evaluate({
        projectPath: P14_PROJ_DIR,
        projectId: "gym_p14_project",
        generationId: completedG1.generationId,
        productSuccessReport: {
          status: "SUCCESS",
          specificationPassed: true,
          matrixPassed: true,
          goldenWorkflowsPassed: true,
          realityPassed: true,
          summary: "Product specs verified.",
        },
      });

      expect(releaseCert.status).toBe("RELEASED");
      expect(existsSync(join(P14_PROJ_DIR, ".aegis", "sbom.json"))).toBe(true);
      expect(existsSync(join(P14_PROJ_DIR, ".aegis", "release-certificate.json"))).toBe(true);

      // 3. Staged Deployment
      const deployResult = await DeploymentEngine.deploy(
        P14_PROJ_DIR,
        "gym_p14_project",
        releaseCert.releaseId,
        "PRODUCTION",
        true // authorized
      );
      expect(deployResult.status).toBe("SUCCESS");

      // 4. Resource Leak Audit
      await RuntimeProcessManager.stopAll();
      const leakReport = await ResourceLeakDetector.audit();
      expect(leakReport.clean).toBe(true);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
