import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import http from "node:http";
import { JobOrchestrator } from "../job-orchestrator.js";
import { RuntimeProcessManager } from "../../execution/runtime-process-manager.js";
import { GoldenWorkflowRegistry } from "../../evolution/golden-workflow-registry.js";
import { TaskFileLockManager } from "../../governance/file-ownership-registry.js";

const CP_E2E_DIR = join(process.cwd(), ".tmp_test_phase12_e2e");

describe("AEGIS Phase 12 — Master Control Plane End-to-End Acceptance Test", () => {
  beforeEach(() => {
    if (existsSync(CP_E2E_DIR)) rmSync(CP_E2E_DIR, { recursive: true, force: true });
    mkdirSync(CP_E2E_DIR, { recursive: true });
    JobOrchestrator.reset();
    GoldenWorkflowRegistry.clear();
    TaskFileLockManager.getInstance().reset();
  });

  afterEach(async () => {
    await RuntimeProcessManager.stopAll();
    JobOrchestrator.reset();
    GoldenWorkflowRegistry.clear();
    TaskFileLockManager.getInstance().reset();
    if (existsSync(CP_E2E_DIR)) rmSync(CP_E2E_DIR, { recursive: true, force: true });
  });

  it("executes complete lifecycle: Job Creation -> Dry Run -> Execution -> Live Verification -> Feedback Preview -> Evolution", async () => {
    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 1. Create Job
    const jobG1 = JobOrchestrator.createJob({
      projectId: "gym_cp_project",
      projectPath: CP_E2E_DIR,
      prompt: rawPrompt,
    });
    expect(jobG1.status).toBe("QUEUED");

    // 2. Run Dry Run
    const dryRun = JobOrchestrator.runDryRun(jobG1.jobId);
    expect(dryRun.status).toBe("DRY_RUN_COMPLETED");
    expect(existsSync(join(CP_E2E_DIR, "src"))).toBe(false);

    // Live Server & DB Mock
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
            const member = { id: dbMembers.length + 1, name: data.name || "Member" };
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

      // 3. Start G1 Job
      const completedG1 = await JobOrchestrator.startJob(jobG1.jobId, {
        liveServerUrl: baseUrl,
        apiWorkflowSteps: [
          {
            workflowId: "wf_create_member",
            operationId: "createMember",
            method: "POST",
            path: "/api/members",
            requestBody: { name: "Bob" },
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
          mkdirSync(join(CP_E2E_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(CP_E2E_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(CP_E2E_DIR, "prisma"), { recursive: true });

          writeFileSync(join(CP_E2E_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(CP_E2E_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(CP_E2E_DIR, "prisma/schema.prisma"),
            `datasource db {\n  provider = "postgresql"\n  url = env("DATABASE_URL")\n}\n\nmodel User {\n  id Int @id @default(autoincrement())\n}\n\nmodel Member {\n  id Int @id @default(autoincrement())\n  name String\n}`,
            "utf8"
          );

          return {
            success: true,
            createdFiles: [
              "src/features/members/MemberList.tsx",
              "server/routes/members.ts",
              "prisma/schema.prisma",
            ],
            modifiedFiles: [],
            deletedFiles: [],
          };
        },
      });

      if (completedG1.error) console.log("G1 ERROR:", completedG1.error);
      expect(completedG1.status).toBe("COMPLETED");
      expect(completedG1.finalStatus).toBe("SUCCESS");
      expect(dbMembers.length).toBe(1);


      // 4. Change Preview for Feedback
      const preview = JobOrchestrator.previewChange(CP_E2E_DIR, "Add dark theme styles");
      expect(preview.risk).toBe("LOW");
      expect(preview.authorizationRequired).toBe(false);

      // 5. Create and Run G2 Job
      const jobG2 = JobOrchestrator.createJob({
        projectId: "gym_cp_project",
        projectPath: CP_E2E_DIR,
        parentGenerationId: completedG1.generationId,
        type: "INCREMENTAL_EVOLUTION",
        prompt: "Add dark theme styles",
      });

      const completedG2 = await JobOrchestrator.startJob(jobG2.jobId, {
        liveServerUrl: baseUrl,
        customExecutor: async () => {
          mkdirSync(join(CP_E2E_DIR, "src/styles"), { recursive: true });
          writeFileSync(join(CP_E2E_DIR, "src/styles/dark.css"), "body { background: #000; }", "utf8");
          return {
            success: true,
            createdFiles: ["src/styles/dark.css"],
            modifiedFiles: [],
            deletedFiles: [],
          };
        },
      });

      if (completedG2.error) console.log("G2 ERROR:", completedG2.error);
      expect(completedG2.status).toBe("COMPLETED");
      expect(completedG2.finalStatus).toBe("SUCCESS");


      // Verify member data preserved
      expect(dbMembers.length).toBe(1);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
