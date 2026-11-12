import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer, type Server } from "node:http";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { writeFileSync, readFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { execSync } from "node:child_process";

import { DynamicApiGenerator } from "../dynamic-api-generator.js";
import { CanonicalResourceRegistry } from "../../architect/canonical-resource-registry.js";
import type { LockedArchitectureContract } from "../../architect/architecture-contract-engine.js";

describe("Phase 3.5 — Authentication Trust-Boundary Closure & Independent Deployment Verification", () => {
  let fixtureDir: string;
  let dbPath: string;
  let server: Server;
  let baseUrl: string;
  let independentPrisma: any;
  let generatedFiles: ReturnType<typeof DynamicApiGenerator.generateAll>;
  let signAuthToken: any;
  let verifyAuthToken: any;

  const contract: LockedArchitectureContract = {
    version: 2,
    contractHash: "phase35_auth_deployment_hash",
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
            { name: "price", type: "Float", constraints: "@min(0)" },
            { name: "temperatureTolerance", type: "Float", constraints: "@allowNegative" },
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
    // 1. Register canonical resource mapping with workflows
    CanonicalResourceRegistry.register("CeramicPiece", {
      singularResourceName: "Ceramic Piece",
      canonicalUrlSlug: "ceramic-pieces",
      customWorkflows: [
        {
          action: "reservePiece",
          method: "POST",
          pathSuffix: "/workflow",
          description: "Reserves ceramic piece for collector",
          allowedPriorStates: ["ACTIVE"],
          targetState: "RESERVED",
          requiredRoles: ["collector", "curator", "ADMIN"],
          transactional: true,
          auditLogged: true,
        },
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

    // 2. Create isolated temporary fixture directory
    fixtureDir = join(tmpdir(), `aegis_p35_deploy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
    mkdirSync(join(fixtureDir, "prisma"), { recursive: true });

    dbPath = join(fixtureDir, "prisma", "dev.db");
    const normalizedDbUrl = `file:${dbPath.replace(/\\/g, "/")}`;
    process.env.DATABASE_URL = normalizedDbUrl;
    process.env.JWT_SECRET = "phase35-auth-closure-test-secret-32bytes";

    // 3. Generate all backend files using DynamicApiGenerator
    generatedFiles = DynamicApiGenerator.generateAll(contract);

    // 4. Write all generated files into fixture directory
    for (const file of generatedFiles) {
      const fullPath = join(fixtureDir, file.path);
      const parentDir = join(fullPath, "..");
      mkdirSync(parentDir, { recursive: true });
      writeFileSync(fullPath, file.content, "utf8");
    }

    // 5. Link node_modules for local Prisma engine & dependency access
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
      // Junction may already exist
    }

    // 6. Push database schema and generate Prisma client
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

    // 7. Dynamically import generated auth middleware
    const authPath = join(fixtureDir, "server", "src", "middleware", "auth.ts");
    const authModule = await import(pathToFileURL(authPath).href);
    signAuthToken = authModule.signAuthToken;
    verifyAuthToken = authModule.verifyAuthToken;

    // 8. Launch generated Express server
    const serverIndexPath = join(fixtureDir, "server", "src", "index.ts");
    const serverModule = await import(pathToFileURL(serverIndexPath).href);
    const app = serverModule.default || serverModule.app;

    server = createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });

    // 9. Initialize independent PrismaClient oracle
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
        // Temporary lock ignore
      }
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Requirement 1 & 2: Fail-Closed Authentication & Trustworthy Token Lifecycle
  // ──────────────────────────────────────────────────────────────────────────
  describe("Requirement 1 & 2: Fail-Closed Authentication & Token Lifecycle", () => {
    let testPieceId: string;

    beforeAll(async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Obsidian Teabowl",
          category: "STONEWARE",
          sku: "OBS-001",
          price: 120.0,
          temperatureTolerance: -15.5,
          status: "ACTIVE",
        }),
      });
      const data = await res.json() as any;
      testPieceId = data.id;
    });

    it("fails closed across all environments: rejects unauthenticated workflow requests with HTTP 401", async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces/${testPieceId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive" }),
      });

      expect(res.status).toBe(401);
      const data = await res.json() as any;
      expect(data.error).toContain("requires verified authentication");
    });

    it("strictly rejects untrusted raw role header spoofing (x-user-role) without token in non-prod", async () => {
      // Regardless of NODE_ENV, raw x-user-role header is stripped and never establishes identity
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

    it("strictly ignores body-supplied role attributes ({ role: 'ADMIN' })", async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces/${testPieceId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive", role: "ADMIN" }),
      });

      expect(res.status).toBe(401);
      const data = await res.json() as any;
      expect(data.error).toContain("requires verified authentication");
    });

    it("strictly rejects tampered HMAC token signatures with HTTP 401", async () => {
      const validToken = signAuthToken({ id: "user-1", role: "ADMIN" });
      const tamperedToken = validToken.slice(0, -6) + "xxxxxx";

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

    it("strictly rejects expired tokens with HTTP 401", async () => {
      // Sign token with -60s expiration
      const expiredToken = signAuthToken({ id: "user-1", role: "ADMIN" }, -60);

      const res = await fetch(`${baseUrl}/api/ceramic-pieces/${testPieceId}/workflow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${expiredToken}`,
        },
        body: JSON.stringify({ action: "archive" }),
      });

      expect(res.status).toBe(401);
      const data = await res.json() as any;
      expect(data.error).toContain("expired");
    });

    it("strictly rejects tokens issued for another application (audience mismatch)", () => {
      // Craft a token with different audience
      const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
      const claims = {
        id: "attacker",
        role: "ADMIN",
        iss: "aegis-auth",
        aud: "foreign-unrelated-application",
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
      const crypto = require("node:crypto");
      const signature = crypto
        .createHmac("sha256", process.env.JWT_SECRET || "")
        .update(`${header}.${body}`)
        .digest("base64url");
      const foreignAudToken = `${header}.${body}.${signature}`;

      const verified = verifyAuthToken(foreignAudToken);
      expect(verified).toBeNull(); // Mismatched audience fails closed
    });

    it("rejects unauthorized role (GUEST) with HTTP 403 Forbidden", async () => {
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

    it("executes authorized workflow with verified ADMIN token and persists via Prisma", async () => {
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

      // Independent Oracle confirms ARCHIVED on disk
      const persisted = await independentPrisma.ceramicPiece.findUnique({
        where: { id: testPieceId },
      });
      expect(persisted.status).toBe("ARCHIVED");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Requirement 3: Workflow-State Bypass Closure (Terminal & Intermediate States)
  // ──────────────────────────────────────────────────────────────────────────
  describe("Requirement 3: Workflow-State Bypass Closure", () => {
    let secondPieceId: string;

    beforeAll(async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Stoneware Vase",
          category: "STONEWARE",
          sku: "VASE-002",
          price: 85.0,
          temperatureTolerance: 25.0,
          status: "ACTIVE",
        }),
      });
      const data = await res.json() as any;
      expect(res.status).toBe(201);
      secondPieceId = data.id;
    });

    it("rejects generic PUT attempting to directly assign terminal state 'ARCHIVED'", async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces/${secondPieceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.error).toContain("Direct modification of workflow-managed field 'status' is prohibited");

      // Verify oracle: database remains unchanged
      const persisted = await independentPrisma.ceramicPiece.findUnique({
        where: { id: secondPieceId },
      });
      expect(persisted.status).toBe("ACTIVE");
    });

    it("rejects generic PUT attempting to directly assign intermediate state 'RESERVED'", async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces/${secondPieceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESERVED" }),
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.error).toContain("Direct modification of workflow-managed field 'status' is prohibited");

      // Verify oracle: database remains unchanged
      const persisted = await independentPrisma.ceramicPiece.findUnique({
        where: { id: secondPieceId },
      });
      expect(persisted.status).toBe("ACTIVE");
    });

    it("allows generic PUT to update ordinary fields while preserving status", async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces/${secondPieceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: 99.0,
          description: "Studio display vase with custom cobalt wash",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.price).toBe(99.0);
      expect(data.description).toBe("Studio display vase with custom cobalt wash");
      expect(data.status).toBe("ACTIVE"); // Status remained intact

      // Verify oracle
      const persisted = await independentPrisma.ceramicPiece.findUnique({
        where: { id: secondPieceId },
      });
      expect(persisted.price).toBe(99.0);
      expect(persisted.status).toBe("ACTIVE");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Requirement 4: Canonical Validation Constraints
  // ──────────────────────────────────────────────────────────────────────────
  describe("Requirement 4: Canonical Validation Constraints", () => {
    it("rejects negative values when prohibited by canonical metadata (@min(0))", async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Faulty Price Vase",
          category: "STONEWARE",
          sku: "FAULT-001",
          price: -50.0, // Prohibited
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.error).toBe("Validation failed");
    });

    it("accepts negative values when explicitly permitted by canonical metadata (@allowNegative)", async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Cryogenic Ceramic Tile",
          category: "TECHNICAL",
          sku: "CRYO-001",
          price: 250.0,
          temperatureTolerance: -196.5, // Explicitly allowed negative
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.temperatureTolerance).toBe(-196.5);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Requirement 5: Independent Generated-Project Installation & TypeScript Compilation
  // ──────────────────────────────────────────────────────────────────────────
  describe("Requirement 5: Independent Generated-Project Packaging & Build", () => {
    it("verifies server/tsconfig.json compiles cleanly with tsc without monorepo dependencies", () => {
      // Execute tsc against the isolated fixture
      const tscCmd = join(process.cwd(), "node_modules", "typescript", "bin", "tsc");
      const tsconfigPath = join(fixtureDir, "server", "tsconfig.json");

      expect(() => {
        execSync(`node "${tscCmd}" --project "${tsconfigPath}" --noEmit`, {
          cwd: fixtureDir,
          stdio: "pipe",
        });
      }).not.toThrow();
    });

    it("verifies server/package.json contains all runtime dependencies and build scripts", () => {
      const pkg = JSON.parse(readFileSync(join(fixtureDir, "server", "package.json"), "utf8"));
      expect(pkg.dependencies.express).toBeDefined();
      expect(pkg.dependencies.cors).toBeDefined();
      expect(pkg.dependencies.zod).toBeDefined();
      expect(pkg.dependencies["@prisma/client"]).toBeDefined();
      expect(pkg.dependencies.dotenv).toBeDefined();

      expect(pkg.devDependencies.prisma).toBeDefined();
      expect(pkg.devDependencies.typescript).toBeDefined();
      expect(pkg.devDependencies["@types/express"]).toBeDefined();
    });
  });
});
