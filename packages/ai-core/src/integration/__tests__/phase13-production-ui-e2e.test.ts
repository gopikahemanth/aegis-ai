import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import http from "node:http";
import { JobOrchestrator } from "../../control-plane/job-orchestrator.js";
import { JobStore } from "../../control-plane/job-store.js";
import { ProgressEventEmitter } from "../../control-plane/progress-events.js";
import { TelemetryTracker } from "../../control-plane/telemetry.js";
import { AuditLog } from "../../control-plane/audit-log.js";
import { RuntimeProcessManager } from "../../execution/runtime-process-manager.js";
import { GoldenWorkflowRegistry } from "../../evolution/golden-workflow-registry.js";
import { TaskFileLockManager } from "../../governance/file-ownership-registry.js";
import { TaskCacheManager } from "../../execution/task-cache.js";


const P13_PROJ_A = join(process.cwd(), ".tmp_test_p13_proj_a");
const P13_PROJ_B = join(process.cwd(), ".tmp_test_p13_proj_b");

describe("AEGIS Phase 13 — Production-Grade UI & Operational Control Master Acceptance Test", () => {
  beforeEach(() => {
    if (existsSync(P13_PROJ_A)) rmSync(P13_PROJ_A, { recursive: true, force: true });
    if (existsSync(P13_PROJ_B)) rmSync(P13_PROJ_B, { recursive: true, force: true });
    mkdirSync(P13_PROJ_A, { recursive: true });
    mkdirSync(P13_PROJ_B, { recursive: true });
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
    if (existsSync(P13_PROJ_A)) rmSync(P13_PROJ_A, { recursive: true, force: true });
    if (existsSync(P13_PROJ_B)) rmSync(P13_PROJ_B, { recursive: true, force: true });
  });

  it("executes complete Phase 13 lifecycle: Studio -> Dry Run -> Live Generation -> Verification Matrix -> Gate -> G2 Evolution -> Diff", async () => {
    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // 1. Generation Studio: Create Job & Dry Run
    const jobG1 = JobOrchestrator.createJob({
      projectId: "gym_p13_project",
      projectPath: P13_PROJ_A,
      prompt: rawPrompt,
    });
    expect(jobG1.status).toBe("QUEUED");

    const dryRun = JobOrchestrator.runDryRun(jobG1.jobId);
    expect(dryRun.status).toBe("DRY_RUN_COMPLETED");
    expect(dryRun.diskMutations).toBe(0);
    expect(existsSync(join(P13_PROJ_A, "src"))).toBe(false);

    // Live Server Setup for Verification
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
            const member = { id: dbMembers.length + 1, name: data.name || "Bob" };
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

      // 2. Start G1 Autonomous Generation
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
          mkdirSync(join(P13_PROJ_A, "src/features/members"), { recursive: true });
          mkdirSync(join(P13_PROJ_A, "server/routes"), { recursive: true });
          mkdirSync(join(P13_PROJ_A, "prisma"), { recursive: true });

          writeFileSync(join(P13_PROJ_A, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(P13_PROJ_A, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(P13_PROJ_A, "prisma/schema.prisma"),
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

      expect(completedG1.status).toBe("COMPLETED");
      expect(completedG1.finalStatus).toBe("SUCCESS");
      expect(dbMembers.length).toBe(1);

      // 3. User Feedback: Preview Blast Radius
      const preview = JobOrchestrator.previewChange(P13_PROJ_A, "Add dark theme styles");
      expect(preview.risk).toBe("LOW");
      expect(preview.blastRadius).toBe("LOCAL");

      // 4. Start G2 Continuous Evolution
      const jobG2 = JobOrchestrator.createJob({
        projectId: "gym_p13_project",
        projectPath: P13_PROJ_A,
        parentGenerationId: completedG1.generationId,
        type: "INCREMENTAL_EVOLUTION",
        prompt: "Add dark theme styles",
      });

      const completedG2 = await JobOrchestrator.startJob(jobG2.jobId, {
        liveServerUrl: baseUrl,
        customExecutor: async () => {
          mkdirSync(join(P13_PROJ_A, "src/styles"), { recursive: true });
          writeFileSync(join(P13_PROJ_A, "src/styles/dark.css"), "body { background: #000; }", "utf8");
          return {
            success: true,
            createdFiles: ["src/styles/dark.css"],
            modifiedFiles: [],
            deletedFiles: [],
          };
        },
      });

      expect(completedG2.status).toBe("COMPLETED");
      expect(completedG2.finalStatus).toBe("SUCCESS");

      // 5. Generation Diff Inspection
      const diff = JobOrchestrator.getGenerationDiff(P13_PROJ_A, completedG1.generationId, completedG2.generationId);
      expect(diff.filesCreated).toContain("src/styles/dark.css");
      expect(diff.filesPreserved.length).toBeGreaterThan(0);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("maintains strict multi-project isolation across concurrent projects A and B", async () => {
    const jobA = JobOrchestrator.createJob({
      projectId: "project_gym",
      projectPath: P13_PROJ_A,
      prompt: "Build Gym System",
    });

    const jobB = JobOrchestrator.createJob({
      projectId: "project_recipe",
      projectPath: P13_PROJ_B,
      prompt: "Build Recipe Vault",
    });

    expect(jobA.projectId).not.toBe(jobB.projectId);
    expect(jobA.projectPath).not.toBe(jobB.projectPath);

    const jobsA = JobStore.listJobs(P13_PROJ_A);
    const jobsB = JobStore.listJobs(P13_PROJ_B);

    expect(jobsA.some((j) => j.jobId === jobA.jobId)).toBe(true);
    expect(jobsA.some((j) => j.jobId === jobB.jobId)).toBe(false);
    expect(jobsB.some((j) => j.jobId === jobB.jobId)).toBe(true);
    expect(jobsB.some((j) => j.jobId === jobA.jobId)).toBe(false);
  });
});
