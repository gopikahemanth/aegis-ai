import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer, type Server } from "node:http";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { execSync } from "node:child_process";

import { DynamicApiGenerator } from "../../backend/dynamic-api-generator.js";
import { CanonicalResourceRegistry } from "../../architect/canonical-resource-registry.js";
import { ProjectIntegrationMatrix } from "../project-integration-matrix.js";
import { InteractiveComponentGenerator } from "../../design/interactive-component-generator.js";
import type { LockedArchitectureContract } from "../../architect/architecture-contract-engine.js";

describe("Phase D: Frontend–Backend Integration & Contract Synchronization", () => {
  let fixtureDir: string;
  let dbPath: string;
  let server: Server;
  let baseUrl: string;
  let generatedBackendFiles: ReturnType<typeof DynamicApiGenerator.generateAll>;
  let generatedFrontendFiles: ReturnType<typeof DynamicApiGenerator.generateFrontendIntegration>;
  let independentPrisma: any;
  let api: any;
  let ApiError: any;

  const contract: LockedArchitectureContract = {
    version: 2,
    contractHash: "phase_d_integration_test_hash",
    projectName: "AegisIntegratedHealth",
    domainCategory: "APPOINTMENT_SERVICE",
    frontend: {
      framework: "react-vite",
      buildTool: "vite",
      styling: "tailwind",
      stateManagement: "zustand",
      port: 5173,
    },
    backend: {
      framework: "express",
      runtime: "node",
      language: "typescript",
      port: 3001,
      cors: true,
      apiType: "REST",
      corsOrigin: "*",
    },
    database: {
      engine: "sqlite",
      orm: "prisma",
      url: "file:./dev.db",
      migrations: true,
      schemaPath: "prisma/schema.prisma",
    },
    routes: {
      frontendRoutes: [
        { path: "/", componentName: "HomePage" },
        { path: "/appointments", componentName: "AppointmentListPage" },
        { path: "/appointments/new", componentName: "AppointmentListPage" },
        { path: "/appointments/:id", componentName: "AppointmentListPage" },
        { path: "/login", componentName: "AuthForm" },
        { path: "/register", componentName: "AuthForm" },
      ],
      backendEndpoints: [
        { path: "/api/appointments", method: "GET", entity: "Appointment", operation: "LIST", requiresAuth: false },
        { path: "/api/appointments/:id", method: "GET", entity: "Appointment", operation: "GET", requiresAuth: false },
        { path: "/api/appointments", method: "POST", entity: "Appointment", operation: "CREATE", requiresAuth: false },
        { path: "/api/appointments/:id", method: "PUT", entity: "Appointment", operation: "UPDATE", requiresAuth: false },
        { path: "/api/appointments/:id", method: "DELETE", entity: "Appointment", operation: "DELETE", requiresAuth: false },
        { path: "/api/products", method: "GET", entity: "Product", operation: "LIST", requiresAuth: false },
        { path: "/api/products", method: "POST", entity: "Product", operation: "CREATE", requiresAuth: false },
        { path: "/api/products/:id", method: "GET", entity: "Product", operation: "GET", requiresAuth: false },
        { path: "/api/orders", method: "POST", entity: "Order", operation: "CREATE", requiresAuth: false },
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
    directories: ["server/src", "prisma", "src/services", "src/types", "src/hooks", "src/lib"],
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
    fixtureDir = join(tmpdir(), `aegis_phase_d_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
    mkdirSync(join(fixtureDir, "prisma"), { recursive: true });
    mkdirSync(join(fixtureDir, "src", "services"), { recursive: true });
    mkdirSync(join(fixtureDir, "src", "types"), { recursive: true });
    mkdirSync(join(fixtureDir, "src", "hooks"), { recursive: true });
    mkdirSync(join(fixtureDir, "src", "lib"), { recursive: true });

    dbPath = join(fixtureDir, "prisma", "dev.db");
    const normalizedDbUrl = `file:${dbPath.replace(/\\/g, "/")}`;
    process.env.DATABASE_URL = normalizedDbUrl;
    process.env.NODE_ENV = "test";

    // 2. Generate all backend and frontend integration files
    generatedBackendFiles = DynamicApiGenerator.generateAll(contract);
    generatedFrontendFiles = DynamicApiGenerator.generateFrontendIntegration(contract);

    // 3. Write all backend files into fixture directory
    for (const file of generatedBackendFiles) {
      const fullPath = join(fixtureDir, file.path);
      const parentDir = join(fullPath, "..");
      mkdirSync(parentDir, { recursive: true });
      writeFileSync(fullPath, file.content, "utf8");
    }

    // 4. Write all frontend integration files into fixture directory
    for (const file of generatedFrontendFiles) {
      const fullPath = join(fixtureDir, file.path);
      const parentDir = join(fullPath, "..");
      mkdirSync(parentDir, { recursive: true });
      writeFileSync(fullPath, file.content, "utf8");
    }

    // 5. Link node_modules for Prisma
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

    // 7. Mount Express server on ephemeral port
    const serverIndexPath = join(fixtureDir, "server", "src", "index.ts");
    const serverUrl = pathToFileURL(serverIndexPath).href;
    const serverModule = await import(serverUrl);
    const app = serverModule.default || serverModule.app;

    server = createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });

    // 8. Connect independent PrismaClient oracle
    const { PrismaClient } = await import("@prisma/client");
    independentPrisma = new PrismaClient({
      datasources: { db: { url: normalizedDbUrl } },
    });

    // 9. Dynamically import generated frontend API client and configure baseUrl
    const apiPath = join(fixtureDir, "src", "services", "api.ts");
    const apiModule = await import(pathToFileURL(apiPath).href);
    api = apiModule.api || apiModule.default;
    ApiError = apiModule.ApiError;
    api.setBaseUrl(baseUrl);
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
  // 1. Contract-Driven Typed API Client & Types Verification
  // ──────────────────────────────────────────────────────────────────────────
  describe("1. Contract-Driven Typed API Client & Generation Integrity", () => {
    it("generates src/types/api.ts with typed DTOs and ApiResponse envelopes", () => {
      const typesFile = generatedFrontendFiles.find(f => f.path === "src/types/api.ts");
      expect(typesFile).toBeDefined();
      expect(typesFile?.content).toContain("export interface ApiResponse<T>");
      expect(typesFile?.content).toContain("export interface ApiErrorDetails");
      expect(typesFile?.content).toContain("export interface Appointment");
      expect(typesFile?.content).toContain("export interface CreateAppointmentDto");
      expect(typesFile?.content).toContain("export interface Product");
      expect(typesFile?.content).toContain("export interface CreateOrderDto");
      expect(typesFile?.content).toContain("export interface User");
      expect(typesFile?.content).toContain("export interface RegisterDto");
      expect(typesFile?.content).toContain("export interface LoginDto");
    });

    it("generates src/services/api.ts with typed methods, setBaseUrl, and structured ApiError", () => {
      const apiFile = generatedFrontendFiles.find(f => f.path === "src/services/api.ts");
      expect(apiFile).toBeDefined();
      expect(apiFile?.content).toContain("class ApiError extends Error");
      expect(apiFile?.content).toContain("setBaseUrl");
      expect(apiFile?.content).toContain("getBaseUrl");
      expect(apiFile?.content).toContain("auth: {");
      expect(apiFile?.content).toContain("appointments: {");
      expect(apiFile?.content).toContain("products: {");
      expect(apiFile?.content).toContain("orders: {");
      expect(apiFile?.content).toContain("cancel(id: string)");
    });

    it("generates src/hooks/useApi.ts with TanStack Query hooks and cache invalidation", () => {
      const hooksFile = generatedFrontendFiles.find(f => f.path === "src/hooks/useApi.ts");
      expect(hooksFile).toBeDefined();
      expect(hooksFile?.content).toContain("useCurrentUser");
      expect(hooksFile?.content).toContain("useLogin");
      expect(hooksFile?.content).toContain("useRegister");
      expect(hooksFile?.content).toContain("useAppointments");
      expect(hooksFile?.content).toContain("useAppointment");
      expect(hooksFile?.content).toContain("useCreateAppointment");
      expect(hooksFile?.content).toContain("useCancelAppointment");
      expect(hooksFile?.content).toContain("invalidateQueries");
    });

    it("generates src/lib/auth.ts with real storage and zero fake demo token fallbacks", () => {
      const authFile = generatedFrontendFiles.find(f => f.path === "src/lib/auth.ts");
      expect(authFile).toBeDefined();
      expect(authFile?.content).toContain("getAuthToken");
      expect(authFile?.content).toContain("setAuthToken");
      expect(authFile?.content).toContain("clearAuthToken");
      expect(authFile?.content).not.toContain("demo_session_token");
    });

    it("strictly preserves zero-backend footprint for CLIENT_SIDE_APPLICATION contracts", () => {
      const clientOnlyContract: LockedArchitectureContract = {
        ...contract,
        domainCategory: "CLIENT_SIDE_APPLICATION",
      };
      const files = DynamicApiGenerator.generateFrontendIntegration(clientOnlyContract);
      expect(files).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Synchronized Route & Contract Consistency
  // ──────────────────────────────────────────────────────────────────────────
  describe("2. Route & Contract Parity Validation", () => {
    it("validates that all declared frontend and backend routes match contract specifications", () => {
      const feComponents = InteractiveComponentGenerator.generateAll(contract);
      const feFiles = feComponents.map(c => ({ path: c.path, content: c.content }));
      const beFiles = generatedBackendFiles.map(b => ({ path: b.path, content: b.content }));

      const parity = ProjectIntegrationMatrix.validate(contract, feFiles, beFiles);
      expect(parity.passed).toBe(true);
      expect(parity.brokenRoutes).toHaveLength(0);
      expect(parity.orphanedEndpoints).toHaveLength(0);
      expect(parity.missingModels).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Live Cross-Tier Appointment Booking Workflow
  // ──────────────────────────────────────────────────────────────────────────
  describe("3. Live Cross-Tier Appointment Booking Workflow", () => {
    let bookedAppointmentId = "";

    it("retrieves current appointments from live database via generated typed client", async () => {
      const appointments = await api.appointments.list();
      expect(Array.isArray(appointments)).toBe(true);
    });

    it("books a new appointment via api.appointments.create and persists in database", async () => {
      const appointmentData = {
        title: "Comprehensive Wellness Exam",
        startTime: "2026-12-10T09:00:00.000Z",
        endTime: "2026-12-10T10:00:00.000Z",
        staffId: "dr-house",
      };

      const created = await api.appointments.create(appointmentData);
      expect(created.id).toBeDefined();
      expect(created.title).toBe("Comprehensive Wellness Exam");
      expect(created.status).toBe("SCHEDULED");
      bookedAppointmentId = created.id;

      // Independent database verification
      const inDb = await independentPrisma.appointment.findUnique({
        where: { id: bookedAppointmentId },
      });
      expect(inDb).not.toBeNull();
      expect(inDb.title).toBe("Comprehensive Wellness Exam");
      expect(inDb.staffId).toBe("dr-house");
    });

    it("confirms newly booked appointment appears in subsequent api.appointments.list call", async () => {
      const list = await api.appointments.list();
      const found = list.find((a: any) => a.id === bookedAppointmentId);
      expect(found).toBeDefined();
      expect(found.title).toBe("Comprehensive Wellness Exam");
    });

    it("blocks overlapping booking with HTTP 409 Conflict (BOOKING_CONFLICT) via typed client", async () => {
      const overlappingData = {
        title: "Conflicting Slot Exam",
        startTime: "2026-12-10T09:30:00.000Z", // Overlaps 09:00 - 10:00
        endTime: "2026-12-10T10:30:00.000Z",
        staffId: "dr-house",
      };

      await expect(api.appointments.create(overlappingData)).rejects.toThrow(ApiError);

      try {
        await api.appointments.create(overlappingData);
      } catch (err: any) {
        expect(err.status).toBe(409);
        expect(err.code).toBe("BOOKING_CONFLICT");
      }
    });

    it("cancels appointment via api.appointments.cancel and verifies database state transition", async () => {
      const cancelled = await api.appointments.cancel(bookedAppointmentId);
      expect(cancelled.status).toBe("CANCELLED");

      // Independent database verification
      const inDb = await independentPrisma.appointment.findUnique({
        where: { id: bookedAppointmentId },
      });
      expect(inDb.status).toBe("CANCELLED");
    });

    it("rejects duplicate cancellation on already cancelled appointment with HTTP 400 ALREADY_CANCELLED", async () => {
      try {
        await api.appointments.cancel(bookedAppointmentId);
        expect.unreachable("Should have thrown ApiError");
      } catch (err: any) {
        expect(err.status).toBe(400);
        expect(err.code).toBe("ALREADY_CANCELLED");
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Live Cross-Tier E-Commerce Order & Inventory Workflow
  // ──────────────────────────────────────────────────────────────────────────
  describe("4. Live Cross-Tier E-Commerce Order & Inventory Workflow", () => {
    let testProductId = "";

    it("seeds product with inventory=8 and price=$35.00 via api.products.create", async () => {
      const prod = await api.products.create({
        name: "Ergonomic Therapeutic Pillow",
        price: 35.0,
        inventory: 8,
      });

      expect(prod.id).toBeDefined();
      testProductId = prod.id;

      // Independent database verification
      const inDb = await independentPrisma.product.findUnique({
        where: { id: testProductId },
      });
      expect(inDb.inventory).toBe(8);
      expect(inDb.price).toBe(35.0);
    });

    it("submits order with spoofed client total, verifies server price calculation & inventory decrement", async () => {
      const order = await api.orders.create({
        customerEmail: "patient@example.com",
        totalAmount: 1.0, // Client attempted spoof
        items: [{ productId: testProductId, quantity: 3, price: 0.25 }],
      });

      expect(order.id).toBeDefined();
      // Server overrides price: 3 * 35.00 = 105.00
      expect(order.totalAmount).toBe(105.0);

      // Independent database verification: inventory decremented from 8 to 5
      const inDb = await independentPrisma.product.findUnique({
        where: { id: testProductId },
      });
      expect(inDb.inventory).toBe(5);
    });

    it("blocks order exceeding stock with HTTP 409 Conflict (INSUFFICIENT_INVENTORY) and verifies no inventory leak", async () => {
      try {
        await api.orders.create({
          customerEmail: "greedy@example.com",
          items: [{ productId: testProductId, quantity: 10 }], // Only 5 available
        });
        expect.unreachable("Should have thrown ApiError");
      } catch (err: any) {
        expect(err.status).toBe(409);
        expect(err.code).toBe("INSUFFICIENT_INVENTORY");
      }

      // Independent database verification: inventory remains untouched at 5
      const inDb = await independentPrisma.product.findUnique({
        where: { id: testProductId },
      });
      expect(inDb.inventory).toBe(5);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Live Authentication & Protected Endpoint Integration
  // ──────────────────────────────────────────────────────────────────────────
  describe("5. Live Authentication & Credential Synchronization", () => {
    it("registers user via api.auth.register, verifies token storage, and fetches profile via api.auth.me", async () => {
      const reg = await api.auth.register({
        email: "staff.sarah@aegishealth.com",
        password: "StaffPassword123!",
        name: "Dr. Sarah",
        role: "STAFF",
      });

      expect(reg.user.email).toBe("staff.sarah@aegishealth.com");
      expect(reg.token).toBeDefined();

      // Access protected endpoint with stored token
      const profile = await api.auth.me();
      expect(profile.user.email).toBe("staff.sarah@aegishealth.com");
    });

    it("clears token on api.auth.logout and rejects subsequent api.auth.me with HTTP 401 UNAUTHORIZED", async () => {
      api.auth.logout();

      try {
        await api.auth.me();
        expect.unreachable("Should have thrown ApiError");
      } catch (err: any) {
        expect(err.status).toBe(401);
        expect(err.code).toBe("UNAUTHORIZED");
      }
    });

    it("rejects login with wrong password via api.auth.login with HTTP 401 INVALID_CREDENTIALS", async () => {
      try {
        await api.auth.login({
          email: "staff.sarah@aegishealth.com",
          password: "WrongPassword!",
        });
        expect.unreachable("Should have thrown ApiError");
      } catch (err: any) {
        expect(err.status).toBe(401);
        expect(err.code).toBe("INVALID_CREDENTIALS");
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Form Component & Router Integration
  // ──────────────────────────────────────────────────────────────────────────
  describe("6. Form Component & Router Integration", () => {
    it("verifies EntityFormModal has role='alert' error display and disabled submission button", () => {
      const modal = InteractiveComponentGenerator.generateEntityFormModal(contract);
      expect(modal.content).toContain('role="alert"');
      expect(modal.content).toContain("disabled={isSubmitting}");
      expect(modal.content).toContain("isSubmitting");
      expect(modal.content).toContain("serverError");
    });

    it("verifies App.tsx wraps application with QueryClientProvider and connects AuthForm to api.auth", () => {
      const app = InteractiveComponentGenerator.generateAppRouter(contract, {
        entityName: "Appointment",
        entityPlural: "Appointments",
        primaryMetrics: ["Total Appointments"],
        actionVerbs: ["Book"],
        domainPrefix: "appointment",
      });

      expect(app.content).toContain("QueryClientProvider");
      expect(app.content).toContain("api.auth.login");
      expect(app.content).toContain("api.auth.register");
      expect(app.content).toContain('role="alert"');
      expect(app.content).toContain('role="status"');
    });
  });
});
