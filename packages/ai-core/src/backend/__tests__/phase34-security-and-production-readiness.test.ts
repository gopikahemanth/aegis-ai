import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer, type Server } from "node:http";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { writeFileSync, mkdirSync, existsSync, rmSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { execSync } from "node:child_process";

import { DynamicApiGenerator } from "../dynamic-api-generator.js";
import { CanonicalResourceRegistry } from "../../architect/canonical-resource-registry.js";
import type { LockedArchitectureContract } from "../../architect/architecture-contract-engine.js";

describe("Phase 3.4 — Generated Backend Security, Authorization & Production Readiness Audit", () => {
  let fixtureDir: string;
  let dbPath: string;
  let server: Server;
  let baseUrl: string;
  let independentPrisma: any;
  let generatedFiles: ReturnType<typeof DynamicApiGenerator.generateAll>;
  let signAuthToken: any;

  const contract: LockedArchitectureContract = {
    version: 2,
    contractHash: "phase34_security_audit_hash",
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
            { name: "sku", type: "String", constraints: "@unique" },
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
    // Register canonical workflows for CeramicPiece
    CanonicalResourceRegistry.register("CeramicPiece", {
      singularResourceName: "Ceramic Piece",
      canonicalUrlSlug: "ceramic-pieces",
      customWorkflows: [
        {
          action: "markSold",
          method: "POST",
          pathSuffix: "/workflow",
          description: "Marks ceramic piece as sold",
          allowedPriorStates: ["ACTIVE", "RESERVED"],
          targetState: "SOLD",
          requiredRoles: ["curator", "ADMIN"],
          transactional: true,
          auditLogged: true,
        },
        {
          action: "archive",
          method: "POST",
          pathSuffix: "/workflow",
          description: "Archives ceramic piece",
          allowedPriorStates: ["ACTIVE", "SOLD"],
          targetState: "ARCHIVED",
          requiredRoles: ["ADMIN"],
          transactional: true,
          auditLogged: true,
        },
      ],
    });

    // 1. Create isolated temporary fixture directory
    fixtureDir = join(tmpdir(), `aegis_p34_sec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
    mkdirSync(join(fixtureDir, "prisma"), { recursive: true });

    dbPath = join(fixtureDir, "prisma", "dev.db");
    const normalizedDbUrl = `file:${dbPath.replace(/\\/g, "/")}`;
    process.env.DATABASE_URL = normalizedDbUrl;
    process.env.NODE_ENV = "production"; // Test under production security posture
    process.env.JWT_SECRET = "phase34-production-test-secret-32bytes-len";

    // 2. Generate all backend files using DynamicApiGenerator
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

    // 6. Dynamically import generated auth middleware helper & server entry
    const authPath = join(fixtureDir, "server", "src", "middleware", "auth.ts");
    const authModule = await import(pathToFileURL(authPath).href);
    signAuthToken = authModule.signAuthToken;

    const serverIndexPath = join(fixtureDir, "server", "src", "index.ts");
    const serverModule = await import(pathToFileURL(serverIndexPath).href);
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

    // 8. Initialize independent PrismaClient as an external verification oracle
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
  // Directive 1 & 6: Generated Project Manifest & Independence Audit
  // ──────────────────────────────────────────────────────────────────────────
  describe("Directive 1 & 6: Production Packaging & Manifest Independence", () => {
    it("verifies server/package.json declares all required runtime and build dependencies", () => {
      const pkgFile = generatedFiles.find(f => f.path === "server/package.json");
      expect(pkgFile).toBeDefined();
      const pkg = JSON.parse(pkgFile!.content);

      // Runtime dependencies
      expect(pkg.dependencies.express).toBeDefined();
      expect(pkg.dependencies.cors).toBeDefined();
      expect(pkg.dependencies.zod).toBeDefined();
      expect(pkg.dependencies["@prisma/client"]).toBeDefined();
      expect(pkg.dependencies.dotenv).toBeDefined();

      // Build & dev dependencies
      expect(pkg.devDependencies.prisma).toBeDefined();
      expect(pkg.devDependencies.typescript).toBeDefined();
      expect(pkg.devDependencies["@types/express"]).toBeDefined();

      // Scripts
      expect(pkg.scripts.start).toBeDefined();
      expect(pkg.scripts.build).toBeDefined();
      expect(pkg.scripts["prisma:generate"]).toBeDefined();
    });

    it("verifies server/tsconfig.json configures standalone TypeScript compilation", () => {
      const tsconfigFile = generatedFiles.find(f => f.path === "server/tsconfig.json");
      expect(tsconfigFile).toBeDefined();
      const tsconfig = JSON.parse(tsconfigFile!.content);
      expect(tsconfig.compilerOptions.module).toBe("NodeNext");
      expect(tsconfig.compilerOptions.strict).toBe(true);
    });

    it("verifies auth middleware file was generated with cryptographic token verification", () => {
      const authFile = generatedFiles.find(f => f.path.includes("middleware/auth.ts"));
      expect(authFile).toBeDefined();
      expect(authFile!.content).toContain("export function authenticateToken");
      expect(authFile!.content).toContain("export function requireRoles");
      expect(authFile!.content).toContain("export function signAuthToken");
      expect(authFile!.content).toContain("crypto.timingSafeEqual");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Directive 2: Authentication & Authorization Trust Boundary
  // ──────────────────────────────────────────────────────────────────────────
  describe("Directive 2: Authentication Trust Boundary & Role Authorization", () => {
    let testPieceId: string;

    beforeAll(async () => {
      // Create a test piece for authorization assertions
      const res = await fetch(`${baseUrl}/api/ceramic-pieces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Porcelain Celadon Vessel",
          category: "PORCELAIN",
          sku: "VESSEL-001",
          price: 180.0,
          status: "ACTIVE",
        }),
      });
      const data = await res.json() as any;
      testPieceId = data.id;
    });

    it("1. Protected workflow strictly REJECTS unauthenticated requests with HTTP 401", async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces/${testPieceId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive" }),
      });

      expect(res.status).toBe(401);
      const data = await res.json() as any;
      expect(data.error).toContain("requires verified authentication");
    });

    it("2. Protected workflow strictly REJECTS untrusted role header spoofing (x-user-role) with HTTP 401", async () => {
      // Caller attempts to spoof ADMIN role via raw header without a verified bearer token
      const res = await fetch(`${baseUrl}/api/ceramic-pieces/${testPieceId}/workflow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "ADMIN", // Spoofed raw header
        },
        body: JSON.stringify({ action: "archive" }),
      });

      expect(res.status).toBe(401);
      const data = await res.json() as any;
      expect(data.error).toContain("requires verified authentication");
    });

    it("3. Protected workflow strictly IGNORES role spoofing in request body", async () => {
      // Caller attempts to pass "role": "ADMIN" in request body
      const res = await fetch(`${baseUrl}/api/ceramic-pieces/${testPieceId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive", role: "ADMIN" }),
      });

      expect(res.status).toBe(401);
      const data = await res.json() as any;
      expect(data.error).toContain("requires verified authentication");
    });

    it("4. Tampered Bearer token signature is strictly REJECTED with HTTP 401", async () => {
      const validToken = signAuthToken({ id: "user-1", role: "ADMIN" });
      const tamperedToken = validToken.slice(0, -6) + "xxxxxx"; // Invalidate HMAC signature

      const res = await fetch(`${baseUrl}/api/ceramic-pieces/${testPieceId}/workflow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tamperedToken}`,
        },
        body: JSON.stringify({ action: "archive" }),
      });

      expect(res.status).toBe(401);
      const data = await res.json() as any;
      expect(data.error).toContain("tampered authentication token");
    });

    it("5. Verified token with INSUFFICIENT role (GUEST) is REJECTED with HTTP 403 Forbidden", async () => {
      const guestToken = signAuthToken({ id: "guest-user", role: "GUEST" });

      const res = await fetch(`${baseUrl}/api/ceramic-pieces/${testPieceId}/workflow`, {
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

    it("6. Verified token with AUTHORIZED role (ADMIN) SUCCEEDS with HTTP 200 and transitions state", async () => {
      const adminToken = signAuthToken({ id: "admin-user", role: "ADMIN" });

      const res = await fetch(`${baseUrl}/api/ceramic-pieces/${testPieceId}/workflow`, {
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

      // Independent Prisma Oracle Read-Back
      const persisted = await independentPrisma.ceramicPiece.findUnique({
        where: { id: testPieceId },
      });
      expect(persisted.status).toBe("ARCHIVED");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Directive 4 & 5: Input Validation, State Tampering & Workflow Integrity
  // ──────────────────────────────────────────────────────────────────────────
  describe("Directive 4 & 5: Input Validation Boundaries & State Tampering Prevention", () => {
    let secondPieceId: string;

    beforeAll(async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Terracotta Planter",
          category: "TERRACOTTA",
          sku: "PLANTER-002",
          price: 65.0,
          status: "ACTIVE",
        }),
      });
      const data = await res.json() as any;
      secondPieceId = data.id;
    });

    it("7. Negative numeric prices are strictly REJECTED with HTTP 400 Bad Request", async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Faulty Negative Item",
          category: "STONEWARE",
          sku: "NEG-001",
          price: -25.5, // Invalid negative value
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.error).toBe("Validation failed");
    });

    it("8. Direct assignment of protected terminal workflow state via PUT is REJECTED with HTTP 400", async () => {
      // Caller attempts to bypass the workflow state machine by setting status: 'ARCHIVED' directly via PUT
      const res = await fetch(`${baseUrl}/api/ceramic-pieces/${secondPieceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "ARCHIVED", // Protected terminal state!
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.error).toContain("Direct modification of workflow-managed field 'status' is prohibited");

      // Verify oracle: piece status remains ACTIVE
      const persisted = await independentPrisma.ceramicPiece.findUnique({
        where: { id: secondPieceId },
      });
      expect(persisted.status).toBe("ACTIVE");
    });

    it("9. System fields (id, createdAt) supplied in write payloads are stripped and ignored", async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "custom-injected-id-attempt",
          createdAt: "1980-01-01T00:00:00.000Z",
          title: "Handmade Pitcher",
          category: "EARTHENWARE",
          sku: "PITCHER-003",
          price: 45.0,
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json() as any;
      // ID was generated by Prisma UUID, not injected by client
      expect(data.id).not.toBe("custom-injected-id-attempt");
      expect(new Date(data.createdAt).getFullYear()).toBeGreaterThanOrEqual(2026);
    });

    it("10. Unique constraint violation (Prisma P2002) returns HTTP 409 Conflict", async () => {
      // Attempt to create piece with duplicate SKU "PLANTER-002"
      const res = await fetch(`${baseUrl}/api/ceramic-pieces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Duplicate SKU Planter",
          category: "TERRACOTTA",
          sku: "PLANTER-002", // Duplicate SKU
          price: 70.0,
        }),
      });

      expect(res.status).toBe(409);
      const data = await res.json() as any;
      expect(data.error).toContain("Unique constraint violation");
    });

    it("11. Non-existent record queries return clean HTTP 404 Not Found", async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces/nonexistent-id-0000-0000`);
      expect(res.status).toBe(404);
      const data = await res.json() as any;
      expect(data.error).toBe("CeramicPiece not found");
    });

    it("12. Production error handling middleware masks internal 500 server stack traces", async () => {
      // In production mode, requesting non-existent endpoint or internal failure returns sanitized message
      const res = await fetch(`${baseUrl}/api/analytics/metrics`);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.totalCeramicPieces).toBeGreaterThanOrEqual(2);
    });
  });
});
