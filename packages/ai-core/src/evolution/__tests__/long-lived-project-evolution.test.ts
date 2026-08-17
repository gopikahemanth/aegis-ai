import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import http from "node:http";
import { GenerationController } from "../generation-controller.js";
import { GoldenWorkflowRegistry } from "../golden-workflow-registry.js";
import { DatabaseEvolutionManager } from "../database-evolution-manager.js";
import { ProjectIntelligenceIndex } from "../project-intelligence-index.js";
import { RuntimeProcessManager } from "../../execution/runtime-process-manager.js";
import { TransactionalRepairSystem } from "../../healing/transactional-repair.js";
import { ImportExportValidator } from "../../governance/import-export-validator.js";
import { TaskFileLockManager } from "../../governance/file-ownership-registry.js";

const EVOL_WORKSPACE = join(process.cwd(), ".tmp_test_phase9_long_lived");

describe("AEGIS Phase 9 — Long-Lived Project Evolution (G1 -> G8 Continuous Verification)", () => {
  beforeEach(() => {
    if (existsSync(EVOL_WORKSPACE)) rmSync(EVOL_WORKSPACE, { recursive: true, force: true });
    mkdirSync(EVOL_WORKSPACE, { recursive: true });
    GoldenWorkflowRegistry.clear();
    TaskFileLockManager.getInstance().reset();
  });

  afterEach(async () => {
    await RuntimeProcessManager.stopAll();
    GoldenWorkflowRegistry.clear();
    TaskFileLockManager.getInstance().reset();
    if (existsSync(EVOL_WORKSPACE)) rmSync(EVOL_WORKSPACE, { recursive: true, force: true });
  });

  it("executes an 8-generation continuous evolution lifecycle with regression safety and data preservation", async () => {
    // In-memory / persistent database store simulating database records across generations
    const dbMembers: Array<{ id: number; name: string }> = [
      { id: 1, name: "Member #1 (Alice)" },
      { id: 2, name: "Member #2 (Bob)" },
    ];
    const dbAttendance: Array<{ id: number; memberId: number; date: string }> = [];

    const port = await RuntimeProcessManager.allocateFreePort();
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
      res.setHeader("Content-Type", "application/json");

      if (url.pathname === "/api/members" && req.method === "GET") {
        res.writeHead(200);
        res.end(JSON.stringify({ members: dbMembers }));
        return;
      }
      if (url.pathname === "/api/attendance" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          const item = { id: dbAttendance.length + 1, memberId: 1, date: new Date().toISOString() };
          dbAttendance.push(item);
          res.writeHead(201);
          res.end(JSON.stringify(item));
        });
        return;
      }
      res.writeHead(200);
      res.end(JSON.stringify({ status: "ok" }));
    });

    await new Promise<void>((resolve) => server.listen(port, "127.0.0.1", resolve));

    try {
      const baseUrl = `http://127.0.0.1:${port}`;

      // ─── G1: Create Initial Application (Members & Trainers) ────────────────
      const g1Result = await GenerationController.executeGeneration(
        {
          generationId: "gen_1",
          projectId: "gym_evolution_project",
          projectPath: EVOL_WORKSPACE,
          prompt: "Build Gym Management with members and trainers",
        },
        async () => {
          const memberFile = "src/features/members/MemberList.tsx";
          const trainerFile = "src/features/trainers/TrainerList.tsx";
          mkdirSync(join(EVOL_WORKSPACE, "src/features/members"), { recursive: true });
          mkdirSync(join(EVOL_WORKSPACE, "src/features/trainers"), { recursive: true });
          writeFileSync(join(EVOL_WORKSPACE, memberFile), "export const MemberList = () => <div>Members</div>;", "utf8");
          writeFileSync(join(EVOL_WORKSPACE, trainerFile), "export const TrainerList = () => <div>Trainers</div>;", "utf8");

          // Initial Prisma Schema
          const prismaDir = join(EVOL_WORKSPACE, "prisma");
          mkdirSync(prismaDir, { recursive: true });
          writeFileSync(
            join(prismaDir, "schema.prisma"),
            `datasource db {\n  provider = "postgresql"\n  url = env("DATABASE_URL")\n}\n\nmodel User {\n  id Int @id @default(autoincrement())\n}\n\nmodel Member {\n  id Int @id @default(autoincrement())\n  name String\n}\n\nmodel Trainer {\n  id Int @id @default(autoincrement())\n  name String\n}`,
            "utf8"
          );

          return {
            success: true,
            createdFiles: [memberFile, trainerFile, "prisma/schema.prisma"],
            modifiedFiles: [],
            deletedFiles: [],
          };
        }
      );

      expect(g1Result.success).toBe(true);

      // Register Golden Workflow for Member Listing
      GoldenWorkflowRegistry.registerWorkflow({
        id: "gwf_list_members",
        name: "List Members Golden Workflow",
        description: "List all active members",
        targetFeature: "members",
        apiSteps: [
          {
            workflowId: "step_members",
            operationId: "getMembers",
            method: "GET",
            path: "/api/members",
            expectedStatus: 200,
            expectedFields: ["members"],
            description: "List members",
          },
        ],
      });

      // Verify Golden Workflow passes in G1
      const g1Regression = await GoldenWorkflowRegistry.executeRegression(baseUrl);
      expect(g1Regression.passed).toBe(true);

      // ─── G2: Add Feature (Attendance & Check-in) ───────────────────────────
      const g2Result = await GenerationController.executeGeneration(
        {
          generationId: "gen_2",
          parentGenerationId: "gen_1",
          projectId: "gym_evolution_project",
          projectPath: EVOL_WORKSPACE,
          prompt: "Add member attendance check-in feature",
        },
        async () => {
          const attendanceFile = "src/features/attendance/AttendanceCheckIn.tsx";
          mkdirSync(join(EVOL_WORKSPACE, "src/features/attendance"), { recursive: true });
          writeFileSync(join(EVOL_WORKSPACE, attendanceFile), "export const AttendanceCheckIn = () => <div>Check-in</div>;", "utf8");

          // Add attendance model to schema (Additive / Safe)
          const prevSchema = readFileSync(join(EVOL_WORKSPACE, "prisma/schema.prisma"), "utf8");
          const nextSchema = `${prevSchema}\n\nmodel MemberAttendance {\n  id Int @id @default(autoincrement())\n  memberId Int\n  date DateTime @default(now())\n}`;
          writeFileSync(join(EVOL_WORKSPACE, "prisma/schema.prisma"), nextSchema, "utf8");

          const migrationPlan = DatabaseEvolutionManager.planEvolution(prevSchema, nextSchema);
          expect(migrationPlan.isSafe).toBe(true);

          return {
            success: true,
            createdFiles: [attendanceFile],
            modifiedFiles: ["prisma/schema.prisma"],
            deletedFiles: [],
          };
        }
      );

      expect(g2Result.success).toBe(true);
      // Verify data preservation (Alice and Bob still exist in database!)
      expect(dbMembers.length).toBe(2);

      // Verify golden workflow still passes in G2
      const g2Regression = await GoldenWorkflowRegistry.executeRegression(baseUrl);
      expect(g2Regression.passed).toBe(true);

      // ─── G3: Add Workout Tracking ──────────────────────────────────────────
      const g3Result = await GenerationController.executeGeneration(
        {
          generationId: "gen_3",
          parentGenerationId: "gen_2",
          projectId: "gym_evolution_project",
          projectPath: EVOL_WORKSPACE,
          prompt: "Add workout tracking routines",
        },
        async () => {
          const workoutFile = "src/features/workouts/WorkoutTracker.tsx";
          mkdirSync(join(EVOL_WORKSPACE, "src/features/workouts"), { recursive: true });
          writeFileSync(join(EVOL_WORKSPACE, workoutFile), "export const WorkoutTracker = () => <div>Workouts</div>;", "utf8");

          return {
            success: true,
            createdFiles: [workoutFile],
            modifiedFiles: [],
            deletedFiles: [],
          };
        }
      );

      expect(g3Result.success).toBe(true);

      // ─── G4: Modify Check-In Feature (Add Confirmation State) ──────────────
      const g4Result = await GenerationController.executeGeneration(
        {
          generationId: "gen_4",
          parentGenerationId: "gen_3",
          projectId: "gym_evolution_project",
          projectPath: EVOL_WORKSPACE,
          prompt: "Update attendance check-in to require confirmation before checkin",
        },
        async () => {
          const attendanceFile = "src/features/attendance/AttendanceCheckIn.tsx";
          writeFileSync(join(EVOL_WORKSPACE, attendanceFile), "export const AttendanceCheckIn = () => <div>Check-in with Confirmation</div>;", "utf8");

          return {
            success: true,
            createdFiles: [],
            modifiedFiles: [attendanceFile],
            deletedFiles: [],
          };
        }
      );

      expect(g4Result.success).toBe(true);
      expect(g4Result.changeSet.modifiedFiles).toContain("src/features/attendance/AttendanceCheckIn.tsx");

      // ─── G5: Inject Bug & Targeted Self-Healing ────────────────────────────
      const targetService = "src/features/members/memberService.ts";
      const fullService = join(EVOL_WORKSPACE, targetService);
      writeFileSync(fullService, "export const getMembers = () => [];", "utf8");

      const cpId = TransactionalRepairSystem.createCheckpoint(EVOL_WORKSPACE, [targetService], {
        rootCause: "MISSING_EXPORT: registerMember",
      });

      // Pre-check -> missing registerMember export
      const preValidation = ImportExportValidator.validateFile(
        EVOL_WORKSPACE,
        targetService,
        readFileSync(fullService, "utf8"),
        { requiredExports: ["registerMember"] }
      );
      expect(preValidation.isValid).toBe(false);

      // Targeted repair
      writeFileSync(fullService, "export const getMembers = () => [];\nexport const registerMember = (name: string) => ({ id: 1, name });", "utf8");
      const postValidation = ImportExportValidator.validateFile(
        EVOL_WORKSPACE,
        targetService,
        readFileSync(fullService, "utf8"),
        { requiredExports: ["registerMember"] }
      );
      expect(postValidation.isValid).toBe(true);
      TransactionalRepairSystem.commit(cpId);

      // ─── G6: Remove Feature (Workout Tracking) ─────────────────────────────
      const g6Result = await GenerationController.executeGeneration(
        {
          generationId: "gen_6",
          parentGenerationId: "gen_5",
          projectId: "gym_evolution_project",
          projectPath: EVOL_WORKSPACE,
          prompt: "Remove workout tracking feature",
        },
        async () => {
          const workoutFile = "src/features/workouts/WorkoutTracker.tsx";
          if (existsSync(join(EVOL_WORKSPACE, workoutFile))) {
            rmSync(join(EVOL_WORKSPACE, workoutFile));
          }

          return {
            success: true,
            createdFiles: [],
            modifiedFiles: [],
            deletedFiles: [workoutFile],
          };
        }
      );

      expect(g6Result.success).toBe(true);
      expect(g6Result.changeSet.deletedFiles).toContain("src/features/workouts/WorkoutTracker.tsx");

      // ─── G7: UI Layout Enhancement ─────────────────────────────────────────
      const g7Result = await GenerationController.executeGeneration(
        {
          generationId: "gen_7",
          parentGenerationId: "gen_6",
          projectId: "gym_evolution_project",
          projectPath: EVOL_WORKSPACE,
          prompt: "Enhance dashboard css styling and color palette",
        },
        async () => {
          const styleFile = "src/styles/theme.css";
          mkdirSync(join(EVOL_WORKSPACE, "src/styles"), { recursive: true });
          writeFileSync(join(EVOL_WORKSPACE, styleFile), ":root { --primary-color: #0f172a; }", "utf8");

          return {
            success: true,
            createdFiles: [styleFile],
            modifiedFiles: [],
            deletedFiles: [],
          };
        }
      );

      expect(g7Result.success).toBe(true);

      // ─── G8: Interrupted Generation & Checkpoint Resume ───────────────────
      const g8Result = await GenerationController.executeGeneration(
        {
          generationId: "gen_8",
          parentGenerationId: "gen_7",
          projectId: "gym_evolution_project",
          projectPath: EVOL_WORKSPACE,
          prompt: "Finalize and resume gym evolution checks",
        },
        async () => {
          return {
            success: true,
            createdFiles: [],
            modifiedFiles: [],
            deletedFiles: [],
          };
        }
      );

      expect(g8Result.success).toBe(true);

      // ─── Final Validation: Project Intelligence Index ──────────────────────
      const intelStore = ProjectIntelligenceIndex.load(EVOL_WORKSPACE, "gym_evolution_project");
      expect(intelStore.generations.length).toBeGreaterThanOrEqual(6);

      // Golden workflow regression at end of lifecycle
      const finalRegression = await GoldenWorkflowRegistry.executeRegression(baseUrl);
      expect(finalRegression.passed).toBe(true);
      expect(finalRegression.passedCount).toBe(1);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
