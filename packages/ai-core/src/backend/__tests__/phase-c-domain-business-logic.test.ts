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

describe("Phase C: Backend Development & API Architecture Enhancement", () => {
  let fixtureDir: string;
  let dbPath: string;
  let server: Server;
  let baseUrl: string;
  let generatedFiles: ReturnType<typeof DynamicApiGenerator.generateAll>;

  const contract: LockedArchitectureContract = {
    version: 2,
    contractHash: "phase_c_backend_test_hash",
    projectName: "ApexDomainBackend",
    domainCategory: "BOOKING_SERVICE",
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
        { path: "/api/appointments", method: "GET", entity: "Appointment", operation: "LIST", requiresAuth: false },
        { path: "/api/appointments/:id", method: "GET", entity: "Appointment", operation: "GET", requiresAuth: false },
        { path: "/api/appointments", method: "POST", entity: "Appointment", operation: "CREATE", requiresAuth: false },
        { path: "/api/appointments/:id", method: "PUT", entity: "Appointment", operation: "UPDATE", requiresAuth: false },
        { path: "/api/appointments/:id", method: "DELETE", entity: "Appointment", operation: "DELETE", requiresAuth: false },
        { path: "/api/products", method: "GET", entity: "Product", operation: "LIST", requiresAuth: false },
        { path: "/api/products", method: "POST", entity: "Product", operation: "CREATE", requiresAuth: false },
        { path: "/api/products/:id", method: "PUT", entity: "Product", operation: "UPDATE", requiresAuth: false },
        { path: "/api/orders", method: "POST", entity: "Order", operation: "CREATE", requiresAuth: false },
        { path: "/api/orders", method: "GET", entity: "Order", operation: "LIST", requiresAuth: false },
      ],
    },
    dataModels: {
      models: [
        {
          name: "User",
          fields: [
            { name: "id", type: "String", constraints: "@id @default(uuid())" },
            { name: "email", type: "String", constraints: "@unique" },
            { name: "name", type: "String", constraints: "?" },
            { name: "passwordHash", type: "String" },
            { name: "role", type: "String", constraints: '@default("USER")' },
          ],
        },
        {
          name: "Appointment",
          fields: [
            { name: "id", type: "String", constraints: "@id @default(uuid())" },
            { name: "title", type: "String" },
            { name: "startTime", type: "DateTime" },
            { name: "endTime", type: "DateTime" },
            { name: "staffId", type: "String", constraints: "?" },
            { name: "status", type: "String", constraints: '@default("SCHEDULED")' },
          ],
        },
        {
          name: "Product",
          fields: [
            { name: "id", type: "String", constraints: "@id @default(uuid())" },
            { name: "name", type: "String" },
            { name: "price", type: "Float", constraints: "@min(0)" },
            { name: "inventory", type: "Int", constraints: "@min(0)" },
            { name: "status", type: "String", constraints: '@default("ACTIVE")' },
          ],
        },
        {
          name: "Order",
          fields: [
            { name: "id", type: "String", constraints: "@id @default(uuid())" },
            { name: "customerEmail", type: "String" },
            { name: "totalAmount", type: "Float", constraints: "@min(0)" },
            { name: "status", type: "String", constraints: '@default("PENDING")' },
          ],
        },
      ],
    },
    directories: ["server/src", "prisma"],
    lockedAt: new Date().toISOString(),
  };

  beforeAll(async () => {
    CanonicalResourceRegistry.register("Appointment", {
      customWorkflows: [
        {
          action: "cancel",
          method: "POST",
          pathSuffix: "/workflow",
          description: "Cancels appointment",
          allowedPriorStates: ["SCHEDULED", "CONFIRMED"],
          targetState: "CANCELLED",
          transactional: false,
          auditLogged: true,
        },
      ],
    });

    // 1. Create isolated temporary directory
    fixtureDir = join(tmpdir(), `aegis_phase_c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
    mkdirSync(join(fixtureDir, "prisma"), { recursive: true });

    dbPath = join(fixtureDir, "prisma", "dev.db");
    const normalizedDbUrl = `file:${dbPath.replace(/\\/g, "/")}`;
    process.env.DATABASE_URL = normalizedDbUrl;
    process.env.NODE_ENV = "test";

    // 2. Generate all backend files
    generatedFiles = DynamicApiGenerator.generateAll(contract);

    // 3. Write files into fixture directory
    for (const file of generatedFiles) {
      const fullPath = join(fixtureDir, file.path);
      const parentDir = join(fullPath, "..");
      mkdirSync(parentDir, { recursive: true });
      writeFileSync(fullPath, file.content, "utf8");
    }

    // 4. Link node_modules for Prisma
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

    // 5. Run Prisma db push & generate
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

    // 6. Import generated Express server entrypoint
    const serverIndexPath = join(fixtureDir, "server", "src", "index.ts");
    const serverUrl = pathToFileURL(serverIndexPath).href;
    const serverModule = await import(serverUrl);
    const app = serverModule.default || serverModule.app;

    // 7. Mount server on ephemeral port
    server = createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  }, 45000);

  afterAll(async () => {
    CanonicalResourceRegistry.clearRegistry();
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    if (fixtureDir && existsSync(fixtureDir)) {
      try {
        const fixtureNodeModules = join(fixtureDir, "node_modules");
        if (existsSync(fixtureNodeModules)) {
          execSync(`cmd /c rmdir "${fixtureNodeModules}"`, { stdio: "ignore" });
        }
        rmSync(fixtureDir, { recursive: true, force: true });
      } catch {
        // Ignore temporary file lock
      }
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Static Contract & Structural Generation Verification
  // ──────────────────────────────────────────────────────────────────────────
  describe("Structural Generation & Architecture Adherence", () => {
    it("generates separate AuthController with register, login, and me endpoints", () => {
      const authController = generatedFiles.find(f => f.path === "server/src/controllers/AuthController.ts");
      expect(authController).toBeDefined();
      expect(authController?.content).toContain("class AuthController");
      expect(authController?.content).toContain("public static async register");
      expect(authController?.content).toContain("public static async login");
      expect(authController?.content).toContain("public static async me");
      expect(authController?.content).toContain("hashPassword");
      expect(authController?.content).toContain("verifyPassword");
      expect(authController?.content).toContain("signAuthToken");
    });

    it("generates database compatibility aliases for CoderAgent import flexibility", () => {
      const prismaLib = generatedFiles.find(f => f.path === "server/src/lib/prisma.ts");
      const dbIndex = generatedFiles.find(f => f.path === "server/src/db/index.ts");
      expect(prismaLib).toBeDefined();
      expect(prismaLib?.content).toContain("export { prisma };");
      expect(prismaLib?.content).toContain("export default prisma;");
      expect(dbIndex).toBeDefined();
      expect(dbIndex?.content).toContain("export { prisma };");
      expect(dbIndex?.content).toContain("export default prisma;");
    });

    it("generates standard parameter, pagination, register, and login validation schemas", () => {
      const validators = generatedFiles.find(f => f.path === "server/src/validators/index.ts");
      expect(validators).toBeDefined();
      expect(validators?.content).toContain("export const ParamsIdSchema");
      expect(validators?.content).toContain("export const PaginationQuerySchema");
      expect(validators?.content).toContain("export const RegisterSchema");
      expect(validators?.content).toContain("export const LoginSchema");
      expect(validators?.content).toContain("CreateAppointmentSchema");
      expect(validators?.content).toContain("CreateProductSchema");
      expect(validators?.content).toContain("CreateOrderSchema");
    });

    it("mounts auth routes and resource routes on apiRouter", () => {
      const routes = generatedFiles.find(f => f.path === "server/src/routes/api.ts");
      expect(routes).toBeDefined();
      expect(routes?.content).toContain("apiRouter.post('/auth/register', AuthController.register);");
      expect(routes?.content).toContain("apiRouter.post('/auth/login', AuthController.login);");
      expect(routes?.content).toContain("apiRouter.get('/auth/me', AuthController.me);");
      expect(routes?.content).toContain("apiRouter.get('/health',");
      expect(routes?.content).toContain("apiRouter.get('/analytics/metrics',");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Runtime Authentication & Security Tests
  // ──────────────────────────────────────────────────────────────────────────
  describe("Authentication, Credential Hashing & Token Verification", () => {
    let authToken = "";

    it("registers a new user with hashed password and returns standard JSON envelope", async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test.author@example.com",
          password: "SecurePassword123!",
          name: "Test Author",
          role: "USER",
        }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.user.email).toBe("test.author@example.com");
      expect(json.data.token).toBeDefined();
      // Ensure password hash is not leaked in response
      expect(json.data.user.passwordHash).toBeUndefined();
    });

    it("rejects duplicate user registration with HTTP 409 Conflict", async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test.author@example.com",
          password: "SecurePassword123!",
          name: "Duplicate User",
        }),
      });

      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.errorDetails.code).toBe("USER_ALREADY_EXISTS");
    });

    it("authenticates valid credentials on /api/auth/login and issues bearer token", async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test.author@example.com",
          password: "SecurePassword123!",
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.token).toBeDefined();
      expect(typeof json.data.token).toBe("string");
      authToken = json.data.token;
    });

    it("rejects invalid password on /api/auth/login with HTTP 401 Unauthorized", async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test.author@example.com",
          password: "WrongPassword123!",
        }),
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.errorDetails.code).toBe("INVALID_CREDENTIALS");
    });

    it("retrieves current authenticated user from /api/auth/me with Bearer token", async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.user.email).toBe("test.author@example.com");
    });

    it("rejects unauthenticated requests to /api/auth/me with HTTP 401 Unauthorized", async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.errorDetails.code).toBe("UNAUTHORIZED");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Domain Business Logic: Appointment Double-Booking Conflict Prevention
  // ──────────────────────────────────────────────────────────────────────────
  describe("Appointment Double-Booking Conflict Prevention", () => {
    let bookedId = "";

    it("rejects appointment booking if startTime is after or equal to endTime", async () => {
      const res = await fetch(`${baseUrl}/api/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Inverted Time Booking",
          startTime: "2026-12-01T14:00:00.000Z",
          endTime: "2026-12-01T12:00:00.000Z",
          staffId: "dr-smith",
        }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.errorDetails.code).toBe("INVALID_TIME_RANGE");
    });

    it("successfully creates an appointment for an available time slot", async () => {
      const res = await fetch(`${baseUrl}/api/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Initial Checkup",
          startTime: "2026-12-01T10:00:00.000Z",
          endTime: "2026-12-01T11:00:00.000Z",
          staffId: "dr-smith",
        }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBeDefined();
      bookedId = json.data.id;
    });

    it("blocks overlapping appointment with HTTP 409 Conflict (BOOKING_CONFLICT) for same staff", async () => {
      const res = await fetch(`${baseUrl}/api/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Overlapping Checkup",
          startTime: "2026-12-01T10:30:00.000Z",
          endTime: "2026-12-01T11:30:00.000Z",
          staffId: "dr-smith",
        }),
      });

      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.errorDetails.code).toBe("BOOKING_CONFLICT");
      expect(json.errorDetails.conflictId).toBe(bookedId);
    });

    it("allows booking overlapping time slot for a different staff member", async () => {
      const res = await fetch(`${baseUrl}/api/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Parallel Session with Dr. Jones",
          startTime: "2026-12-01T10:30:00.000Z",
          endTime: "2026-12-01T11:30:00.000Z",
          staffId: "dr-jones",
        }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.staffId).toBe("dr-jones");
    });

    it("executes valid workflow cancellation on booked appointment", async () => {
      const res = await fetch(`${baseUrl}/api/appointments/${bookedId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe("CANCELLED");
    });

    it("rejects cancelling an appointment that is already cancelled", async () => {
      const res = await fetch(`${baseUrl}/api/appointments/${bookedId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.errorDetails.code).toBe("ALREADY_CANCELLED");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Domain Business Logic: E-Commerce Price Calculation & Inventory Reservation
  // ──────────────────────────────────────────────────────────────────────────
  describe("E-Commerce Server Price Calculation & Inventory Reservation", () => {
    let productId = "";

    it("seeds a product with inventory=5 and price=$49.99", async () => {
      const res = await fetch(`${baseUrl}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Ceramic Artisan Vase",
          price: 49.99,
          inventory: 5,
        }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBeDefined();
      productId = json.data.id;
    });

    it("calculates order total server-side from product price, ignoring spoofed client price, and decrements inventory", async () => {
      const res = await fetch(`${baseUrl}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: "buyer@example.com",
          totalAmount: 1.00, // Client attempts to spoof total to $1.00
          items: [
            { productId, quantity: 2, price: 0.50 }, // Client attempts to spoof unit price
          ],
        }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      // Server overrides price: 2 * 49.99 = 99.98
      expect(json.data.totalAmount).toBeCloseTo(99.98, 2);

      // Verify inventory was transactionally decremented from 5 to 3
      const prodRes = await fetch(`${baseUrl}/api/products/${productId}`);
      const prodJson = await prodRes.json();
      expect(prodJson.data.inventory).toBe(3);
    });

    it("blocks order with HTTP 409 Conflict (INSUFFICIENT_INVENTORY) when quantity exceeds stock", async () => {
      const res = await fetch(`${baseUrl}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: "greedy@example.com",
          items: [
            { productId, quantity: 10 }, // Only 3 left in stock
          ],
        }),
      });

      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.errorDetails.code).toBe("INSUFFICIENT_INVENTORY");

      // Verify inventory remains untouched at 3
      const prodRes = await fetch(`${baseUrl}/api/products/${productId}`);
      const prodJson = await prodRes.json();
      expect(prodJson.data.inventory).toBe(3);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Validation & Negative Boundary Conditions
  // ──────────────────────────────────────────────────────────────────────────
  describe("Zod Validation & Negative Boundary Enforcement", () => {
    it("rejects negative inventory on product update with HTTP 400 Bad Request", async () => {
      // 1. Create a product first
      const createRes = await fetch(`${baseUrl}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Stock",
          price: 10,
          inventory: 5,
        }),
      });
      const createJson = await createRes.json();
      const pId = createJson.data.id;

      // 2. Attempt to update inventory to negative number
      const res = await fetch(`${baseUrl}/api/products/${pId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventory: -10,
        }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(["NEGATIVE_INVENTORY_PROHIBITED", "VALIDATION_ERROR"]).toContain(json.errorDetails.code);
    });

    it("rejects invalid email format on registration with Zod validation error", async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "not-an-email",
          password: "ValidPassword123!",
        }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.errorDetails.code).toBe("VALIDATION_ERROR");
    });
  });
});
