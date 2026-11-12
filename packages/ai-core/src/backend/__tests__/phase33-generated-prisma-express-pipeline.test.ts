import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer, type Server } from "node:http";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { execSync } from "node:child_process";

import { DynamicApiGenerator } from "../dynamic-api-generator.js";
import { CanonicalResourceRegistry } from "../../architect/canonical-resource-registry.js";
import type { LockedArchitectureContract } from "../../architect/architecture-contract-engine.js";

describe("Phase 3.3 — Actual Generated Prisma-Express Backend Pipeline Integration", () => {
  let fixtureDir: string;
  let dbPath: string;
  let server: Server;
  let baseUrl: string;
  let independentPrisma: any;
  let generatedFiles: ReturnType<typeof DynamicApiGenerator.generateAll>;
  let signAuthToken: any;

  const contract: LockedArchitectureContract = {
    version: 2,
    contractHash: "phase33_generated_test_hash",
    projectName: "ArtisanalCeramicsStudio",
    domainCategory: "E_COMMERCE_CATALOG",
    frontend: {
      framework: "react-vite",
      buildTool: "vite",
      styling: "tailwind",
      stateManagement: "zustand",
      port: 5173,
    },
    backend: {
      framework: "express",
      runtime: "nodejs",
      language: "typescript",
      port: 3001,
      cors: true,
    },
    database: {
      engine: "sqlite",
      orm: "prisma",
      url: "file:./dev.db",
      migrations: true,
    },
    routes: {
      frontendRoutes: [],
      backendEndpoints: [
        { path: "/api/ceramic-pieces", method: "GET", entity: "CeramicPiece", operation: "LIST", requiresAuth: false },
        { path: "/api/ceramic-pieces/:id", method: "GET", entity: "CeramicPiece", operation: "GET", requiresAuth: false },
        { path: "/api/ceramic-pieces", method: "POST", entity: "CeramicPiece", operation: "CREATE", requiresAuth: true },
        { path: "/api/ceramic-pieces/:id", method: "PUT", entity: "CeramicPiece", operation: "UPDATE", requiresAuth: true },
        { path: "/api/ceramic-pieces/:id", method: "DELETE", entity: "CeramicPiece", operation: "DELETE", requiresAuth: true },
        { path: "/api/bookings", method: "POST", entity: "Booking", operation: "CREATE", requiresAuth: true },
        { path: "/api/bookings/:id", method: "DELETE", entity: "Booking", operation: "DELETE", requiresAuth: true },
      ],
    },
    dataModels: {
      models: [
        {
          name: "CeramicPiece",
          fields: [
            { name: "id", type: "String", constraints: "@id @default(uuid())" },
            { name: "title", type: "String" },
            { name: "category", type: "String" },
            { name: "status", type: "String", constraints: "@default(\"ACTIVE\")" },
            { name: "price", type: "Float", constraints: "?" },
            { name: "description", type: "String", constraints: "?" },
          ],
          relations: [
            {
              targetModel: "Booking",
              type: "ONE_TO_MANY",
              relationField: "bookings",
            },
          ],
        },
        {
          name: "Booking",
          fields: [
            { name: "id", type: "String", constraints: "@id @default(uuid())" },
            { name: "title", type: "String" },
            { name: "status", type: "String", constraints: "@default(\"PENDING\")" },
            { name: "notes", type: "String", constraints: "?" },
          ],
          relations: [
            {
              targetModel: "CeramicPiece",
              type: "MANY_TO_ONE",
              foreignKey: "ceramicPieceId",
              relationField: "ceramicPiece",
              onDelete: "Restrict",
            },
          ],
        },
      ],
    },
    directories: ["server/src", "prisma"],
    lockedAt: new Date().toISOString(),
  };

  beforeAll(async () => {
    // Register application-specific business operations with CanonicalResourceRegistry
    CanonicalResourceRegistry.register("CeramicPiece", {
      customWorkflows: [
        {
          action: "markSold",
          method: "POST",
          pathSuffix: "/workflow",
          description: "Marks an available or reserved piece as sold",
          allowedPriorStates: ["ACTIVE", "RESERVED"],
          targetState: "SOLD",
          transactional: true,
          auditLogged: true,
        },
        {
          action: "archive",
          method: "POST",
          pathSuffix: "/workflow",
          description: "Archives a piece; requires ADMIN privileges",
          allowedPriorStates: ["ACTIVE", "SOLD"],
          targetState: "ARCHIVED",
          requiredRoles: ["ADMIN"],
          transactional: false,
          auditLogged: true,
        },
      ],
    });

    CanonicalResourceRegistry.register("Booking", {
      customWorkflows: [
        {
          action: "confirm",
          method: "POST",
          pathSuffix: "/workflow",
          description: "Confirms a pending booking session",
          allowedPriorStates: ["PENDING"],
          targetState: "CONFIRMED",
          transactional: true,
          auditLogged: true,
        },
        {
          action: "cancel",
          method: "POST",
          pathSuffix: "/workflow",
          description: "Cancels an active or pending booking",
          allowedPriorStates: ["PENDING", "CONFIRMED"],
          targetState: "CANCELLED",
          transactional: false,
          auditLogged: true,
        },
      ],
    });

    // 1. Create isolated temporary directory
    fixtureDir = join(tmpdir(), `aegis_p33_pipeline_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
    mkdirSync(join(fixtureDir, "prisma"), { recursive: true });

    dbPath = join(fixtureDir, "prisma", "dev.db");
    const normalizedDbUrl = `file:${dbPath.replace(/\\/g, "/")}`;
    process.env.DATABASE_URL = normalizedDbUrl;
    process.env.NODE_ENV = "test";

    // 2. Generate all backend files using DynamicApiGenerator (The ACTUAL generator under test)
    generatedFiles = DynamicApiGenerator.generateAll(contract);

    // 3. Write all generated files into fixture directory
    for (const file of generatedFiles) {
      const fullPath = join(fixtureDir, file.path);
      const parentDir = join(fullPath, "..");
      mkdirSync(parentDir, { recursive: true });
      writeFileSync(fullPath, file.content, "utf8");
    }

    // 4. Link node_modules to local package node_modules for Prisma engine & runtime access
    const candidatePaths = [
      join(process.cwd(), "node_modules"),
      join(process.cwd(), "generated", "project", "node_modules"),
      join(process.cwd(), "..", "..", "generated", "project", "node_modules"),
      join(process.cwd(), "..", "..", "..", "generated", "project", "node_modules"),
    ];
    const projectNodeModules = candidatePaths.find(p => existsSync(join(p, ".bin", "prisma.cmd"))) || candidatePaths[0];
    const fixtureNodeModules = join(fixtureDir, "node_modules");
    try {
      execSync(`cmd /c mklink /J "${fixtureNodeModules}" "${projectNodeModules}"`, { stdio: "ignore" });
    } catch {
      // Junction may already exist or fall back
    }

    // 5. Run real Prisma CLI to push schema and generate client in the fixture
    const prismaCmd = join(projectNodeModules, ".bin", "prisma.cmd");
    const schemaPath = join(fixtureDir, "prisma", "schema.prisma");

    execSync(`"${prismaCmd}" db push --schema="${schemaPath}" --skip-generate --accept-data-loss`, {
      cwd: fixtureDir,
      stdio: "pipe",
      env: { ...process.env, PRISMA_CLI_QUERY_ENGINE_TYPE: "library" },
    });

    execSync(`"${prismaCmd}" generate --schema="${schemaPath}"`, {
      cwd: fixtureDir,
      stdio: "pipe",
      env: { ...process.env, PRISMA_CLI_QUERY_ENGINE_TYPE: "library" },
    });

    // 6. Dynamically import generated auth helper & Express server entrypoint
    const authPath = join(fixtureDir, "server", "src", "middleware", "auth.ts");
    const authModule = await import(pathToFileURL(authPath).href);
    signAuthToken = authModule.signAuthToken;

    const serverIndexPath = join(fixtureDir, "server", "src", "index.ts");
    const serverUrl = pathToFileURL(serverIndexPath).href;
    const serverModule = await import(serverUrl);
    const app = serverModule.default || serverModule.app;

    // 7. Mount the generated Express app on an ephemeral port
    server = createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });

    // 8. Initialize an independent PrismaClient as an external verification oracle
    const { PrismaClient } = await import("@prisma/client");
    independentPrisma = new PrismaClient({
      datasources: { db: { url: normalizedDbUrl } },
    });
  }, 45000);

  afterAll(async () => {
    CanonicalResourceRegistry.clearRegistry();
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    if (independentPrisma) {
      await independentPrisma.$disconnect();
    }
    if (fixtureDir && existsSync(fixtureDir)) {
      try {
        const fixtureNodeModules = join(fixtureDir, "node_modules");
        if (existsSync(fixtureNodeModules)) {
          execSync(`cmd /c rmdir "${fixtureNodeModules}"`, { stdio: "ignore" });
        }
        rmSync(fixtureDir, { recursive: true, force: true });
      } catch {
        // Ignore temporary file lock on Windows
      }
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Directive 4: Source-Level Evidence of Generated Pipeline
  // ──────────────────────────────────────────────────────────────────────────
  describe("Directive 4: Provenance of Generated Source Files", () => {
    it("verifies generated controllers import and invoke Prisma Client via exact delegates", () => {
      const ceramicController = generatedFiles.find(f => f.path.includes("CeramicPieceController.ts"));
      expect(ceramicController).toBeDefined();
      expect(ceramicController!.content).toContain("import { prisma } from '../db.js';");
      expect(ceramicController!.content).toContain("(prisma as any).ceramicPiece.findMany");
      expect(ceramicController!.content).toContain("(prisma as any).ceramicPiece.create");
      expect(ceramicController!.content).toContain("(prisma as any).ceramicPiece.delete");

      const bookingController = generatedFiles.find(f => f.path.includes("BookingController.ts"));
      expect(bookingController).toBeDefined();
      expect(bookingController!.content).toContain("(prisma as any).booking.create");
      expect(bookingController!.content).toContain("(prisma as any).booking.delete");
    });

    it("verifies generated Express router mounts all controllers and endpoints under /api", () => {
      const routesFile = generatedFiles.find(f => f.path.includes("routes/api.ts"));
      expect(routesFile).toBeDefined();
      expect(routesFile!.content).toContain("import { CeramicPieceController } from '../controllers/CeramicPieceController.js';");
      expect(routesFile!.content).toContain("import { BookingController } from '../controllers/BookingController.js';");
      expect(routesFile!.content).toContain("apiRouter.post('/ceramic-pieces', CeramicPieceController.create);");
      expect(routesFile!.content).toContain("apiRouter.get('/ceramic-pieces/:id', CeramicPieceController.getById);");
      expect(routesFile!.content).toContain("apiRouter.post('/bookings', BookingController.create);");
      expect(routesFile!.content).toContain("apiRouter.post('/ceramic-pieces/:id/workflow', CeramicPieceController.executeWorkflow);");
    });

    it("verifies generated Prisma schema enforces bidirectional relations and onDelete Restrict", () => {
      const schemaFile = generatedFiles.find(f => f.path.includes("schema.prisma"));
      expect(schemaFile).toBeDefined();
      expect(schemaFile!.content).toContain("model CeramicPiece");
      expect(schemaFile!.content).toContain("model Booking");
      expect(schemaFile!.content).toContain("bookings         Booking[]");
      expect(schemaFile!.content).toContain("ceramicPieceId   String?");
      expect(schemaFile!.content).toContain("@relation(fields: [ceramicPieceId], references: [id], onDelete: Restrict)");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Directive 3: Real HTTP Execution through Generated Prisma Backend
  // ──────────────────────────────────────────────────────────────────────────
  describe("Directive 3: Live HTTP Requests -> Express -> Generated Controller -> Prisma -> SQLite", () => {
    let createdPieceId: string;
    let createdBookingId: string;

    it("1. Health check returns HTTP 200 OK with service metadata", async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.status).toBe("ok");
      expect(data.service).toBe("ArtisanalCeramicsStudio");
      expect(data.database).toBe("sqlite");
    });

    it("2. POST /api/ceramic-pieces creates record through Prisma and persists in SQLite", async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Celadon Glazed Teapot",
          category: "STONEWARE",
          price: 95.5,
          description: "Hand-thrown celadon teapot with bamboo handle",
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.id).toBeDefined();
      expect(data.title).toBe("Celadon Glazed Teapot");
      expect(data.price).toBe(95.5);
      createdPieceId = data.id;

      // Independent Prisma Oracle Read-Back
      const persisted = await independentPrisma.ceramicPiece.findUnique({
        where: { id: createdPieceId },
      });
      expect(persisted).not.toBeNull();
      expect(persisted.title).toBe("Celadon Glazed Teapot");
      expect(persisted.status).toBe("ACTIVE");
      expect(persisted.price).toBe(95.5);
    });

    it("3. GET /api/ceramic-pieces retrieves list through Prisma findMany", async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces`);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.items.length).toBeGreaterThanOrEqual(1);
      expect(data.meta.total).toBeGreaterThanOrEqual(1);
      const item = data.items.find((i: any) => i.id === createdPieceId);
      expect(item).toBeDefined();
      expect(item.title).toBe("Celadon Glazed Teapot");
    });

    it("4. GET /api/ceramic-pieces/:id retrieves detail through Prisma findUnique", async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces/${createdPieceId}`);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.id).toBe(createdPieceId);
      expect(data.title).toBe("Celadon Glazed Teapot");
    });

    it("5. PUT /api/ceramic-pieces/:id updates record through Prisma update", async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces/${createdPieceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: 110.0,
          description: "Updated artisanal studio collection piece",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.price).toBe(110.0);
      expect(data.description).toBe("Updated artisanal studio collection piece");

      // Independent Prisma Oracle Read-Back
      const persisted = await independentPrisma.ceramicPiece.findUnique({
        where: { id: createdPieceId },
      });
      expect(persisted.price).toBe(110.0);
      expect(persisted.description).toBe("Updated artisanal studio collection piece");
    });

    it("6. POST /api/bookings creates relational child linked by foreign key", async () => {
      const res = await fetch(`${baseUrl}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Collector Private Viewing",
          ceramicPieceId: createdPieceId,
          notes: "Scheduled for VIP collector preview",
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.id).toBeDefined();
      expect(data.ceramicPieceId).toBe(createdPieceId);
      createdBookingId = data.id;

      // Independent Prisma Oracle Read-Back with relational query
      const booking = await independentPrisma.booking.findUnique({
        where: { id: createdBookingId },
        include: { ceramicPiece: true },
      });
      expect(booking).not.toBeNull();
      expect(booking.ceramicPieceId).toBe(createdPieceId);
      expect(booking.ceramicPiece.title).toBe("Celadon Glazed Teapot");
    });

    it("7. DELETE /api/ceramic-pieces/:id is BLOCKED with HTTP 409 by foreign key restriction", async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces/${createdPieceId}`, {
        method: "DELETE",
      });

      expect(res.status).toBe(409);
      const data = await res.json() as any;
      expect(data.error).toContain("foreign key referential integrity violation");

      // Independent Prisma Oracle Read-Back confirms record is NOT deleted
      const stillExists = await independentPrisma.ceramicPiece.findUnique({
        where: { id: createdPieceId },
      });
      expect(stillExists).not.toBeNull();
    });

    it("8. Two-phase deletion: deletes child booking then successfully deletes parent", async () => {
      // 1. Delete child
      const childRes = await fetch(`${baseUrl}/api/bookings/${createdBookingId}`, {
        method: "DELETE",
      });
      expect(childRes.status).toBe(204);

      // Independent Oracle verifies child is gone
      const childGone = await independentPrisma.booking.findUnique({
        where: { id: createdBookingId },
      });
      expect(childGone).toBeNull();

      // 2. Delete parent now succeeds
      const parentRes = await fetch(`${baseUrl}/api/ceramic-pieces/${createdPieceId}`, {
        method: "DELETE",
      });
      expect(parentRes.status).toBe(204);

      // Independent Oracle verifies parent is gone
      const parentGone = await independentPrisma.ceramicPiece.findUnique({
        where: { id: createdPieceId },
      });
      expect(parentGone).toBeNull();

      // Read-back via API returns 404
      const readBackRes = await fetch(`${baseUrl}/api/ceramic-pieces/${createdPieceId}`);
      expect(readBackRes.status).toBe(404);
    });

    it("9. Zod validation rejects invalid payload with HTTP 400 Bad Request", async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Missing required 'title' and invalid price type
          category: "STONEWARE",
          price: "one-hundred-dollars",
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.error).toBe("Validation failed");
      expect(data.details).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Directive 5: Application-Specific Business Operations (Domain Workflows)
  // ──────────────────────────────────────────────────────────────────────────
  describe("Directive 5: Application-Specific Domain Business Operations", () => {
    let workflowPieceId: string;

    beforeAll(async () => {
      // Create a fresh piece for workflow testing
      const res = await fetch(`${baseUrl}/api/ceramic-pieces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Obsidian Glazed Bowl",
          category: "STONEWARE",
          status: "ACTIVE",
          price: 150.0,
        }),
      });
      const data = await res.json() as any;
      workflowPieceId = data.id;
    });

    it("executes permitted transactional workflow transition (markSold: ACTIVE -> SOLD)", async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces/${workflowPieceId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markSold" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.action).toBe("markSold");
      expect(data.item.status).toBe("SOLD");

      // Independent Prisma Oracle Read-Back confirms status persisted in SQLite
      const piece = await independentPrisma.ceramicPiece.findUnique({
        where: { id: workflowPieceId },
      });
      expect(piece.status).toBe("SOLD");
    });

    it("strictly rejects disallowed state transition with HTTP 400 (markSold on SOLD item)", async () => {
      // Piece is now SOLD; markSold only allows ["ACTIVE", "RESERVED"]
      const res = await fetch(`${baseUrl}/api/ceramic-pieces/${workflowPieceId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markSold" }),
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.error).toContain("is not in allowed prior states");
    });

    it("rejects unauthorized workflow action with HTTP 403 when required role is missing", async () => {
      // 'archive' workflow requires role: ["ADMIN"]
      const guestToken = signAuthToken({ id: "guest-user", role: "GUEST" });
      const res = await fetch(`${baseUrl}/api/ceramic-pieces/${workflowPieceId}/workflow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${guestToken}`,
        },
        body: JSON.stringify({ action: "archive" }),
      });

      expect(res.status).toBe(403);
      const data = await res.json() as any;
      expect(data.error).toContain("Forbidden: workflow action 'archive' requires role [ADMIN]");
    });

    it("successfully executes authorized workflow action when valid role header is provided", async () => {
      const adminToken = signAuthToken({ id: "admin-user", role: "ADMIN" });
      const res = await fetch(`${baseUrl}/api/ceramic-pieces/${workflowPieceId}/workflow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ action: "archive" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.item.status).toBe("ARCHIVED");

      // Independent Oracle confirms ARCHIVED in database
      const piece = await independentPrisma.ceramicPiece.findUnique({
        where: { id: workflowPieceId },
      });
      expect(piece.status).toBe("ARCHIVED");
    });

    it("rejects arbitrary unregistered workflow action with HTTP 400", async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces/${workflowPieceId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "exploitUndefinedTransition" }),
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.error).toContain("Invalid workflow action: exploitUndefinedTransition");
    });
  });
});
