import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import http from "node:http";
import { MasterProductPipeline } from "../master-pipeline.js";
import { RuntimeProcessManager } from "../../execution/runtime-process-manager.js";
import { GoldenWorkflowRegistry } from "../../evolution/golden-workflow-registry.js";
import { TaskFileLockManager } from "../../governance/file-ownership-registry.js";

const MASTER_INT_DIR = join(process.cwd(), ".tmp_test_phase11_master");

describe("AEGIS Phase 11 — Master Product Pipeline End-to-End Integration", () => {
  beforeEach(() => {
    if (existsSync(MASTER_INT_DIR)) rmSync(MASTER_INT_DIR, { recursive: true, force: true });
    mkdirSync(MASTER_INT_DIR, { recursive: true });
    GoldenWorkflowRegistry.clear();
    TaskFileLockManager.getInstance().reset();
  });

  afterEach(async () => {
    await RuntimeProcessManager.stopAll();
    GoldenWorkflowRegistry.clear();
    TaskFileLockManager.getInstance().reset();
    if (existsSync(MASTER_INT_DIR)) rmSync(MASTER_INT_DIR, { recursive: true, force: true });
  });

  it("executes unified master pipeline for G1 generation and G2 evolutionary feedback with live server and regression safety", async () => {
    const rawPrompt = "Build a gym management application where staff can manage members and track attendance.";

    // Live Server & DB Persistence Mock
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
        res.end("<html><body><h1>Gym Management Dashboard</h1></body></html>");
        return;
      }

      res.writeHead(200);
      res.end(JSON.stringify({ ok: true }));
    });

    await new Promise<void>((resolve) => server.listen(port, "127.0.0.1", resolve));

    try {
      const baseUrl = `http://127.0.0.1:${port}`;

      // Register Golden Workflow for Member Listing
      GoldenWorkflowRegistry.registerWorkflow({
        id: "gwf_list_members",
        name: "List Members Golden Workflow",
        description: "List members",
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

      // ─── G1: MasterProductPipeline.generate() ─────────────────────────────
      const g1Result = await MasterProductPipeline.generate({
        projectId: "gym_master_project",
        projectPath: MASTER_INT_DIR,
        prompt: rawPrompt,
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
          { type: "NAVIGATE", url: baseUrl },
          { type: "ASSERT_TEXT", text: "Gym Management Dashboard" },
        ],
        customExecutor: async () => {
          mkdirSync(join(MASTER_INT_DIR, "src/features/members"), { recursive: true });
          mkdirSync(join(MASTER_INT_DIR, "server/routes"), { recursive: true });
          mkdirSync(join(MASTER_INT_DIR, "prisma"), { recursive: true });

          writeFileSync(join(MASTER_INT_DIR, "src/features/members/MemberList.tsx"), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(MASTER_INT_DIR, "server/routes/members.ts"), "export const memberRoutes = () => {};", "utf8");
          writeFileSync(
            join(MASTER_INT_DIR, "prisma/schema.prisma"),
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

      expect(g1Result.status).toBe("SUCCESS");
      expect(g1Result.productSuccessGate?.passed).toBe(true);
      expect(g1Result.stages["PRODUCT_SPECIFICATION"].status).toBe("PASSED");
      expect(g1Result.stages["REQUIREMENT_COMPLETENESS"].status).toBe("PASSED");
      expect(g1Result.stages["FINAL_SUCCESS_GATE"].status).toBe("PASSED");
      expect(g1Result.stages["PRODUCT_SUCCESS_GATE"].status).toBe("PASSED");

      // Verify live mutation
      expect(dbMembers.length).toBe(1);

      // ─── G2: MasterProductPipeline.evolve() ───────────────────────────────
      const g2Result = await MasterProductPipeline.evolve({
        projectId: "gym_master_project",
        projectPath: MASTER_INT_DIR,
        feedbackPrompt: "Improve dashboard layout and styles",
        liveServerUrl: baseUrl,
        customExecutor: async () => {
          mkdirSync(join(MASTER_INT_DIR, "src/styles"), { recursive: true });
          writeFileSync(join(MASTER_INT_DIR, "src/styles/theme.css"), ":root { --brand: #0f172a; }", "utf8");

          return {
            success: true,
            createdFiles: ["src/styles/theme.css"],
            modifiedFiles: [],
            deletedFiles: [],
          };
        },
      });

      expect(g2Result.status).toBe("SUCCESS");
      expect(g2Result.stages["RECONCILIATION"].status).toBe("PASSED");
      expect(g2Result.stages["USER_FEEDBACK_ANALYSIS"].status).toBe("PASSED");
      expect(g2Result.stages["EVOLUTION_EXECUTION"].status).toBe("PASSED");
      expect(g2Result.stages["GOLDEN_REGRESSION"].status).toBe("PASSED");

      // Verify member data preserved across G2
      expect(dbMembers.length).toBe(1);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
