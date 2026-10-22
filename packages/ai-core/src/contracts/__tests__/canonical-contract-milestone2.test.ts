import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, rmSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  FeatureMatrixManager,
  FeatureMatrix,
  FeatureDefinition,
} from "../feature-matrix.js";
import {
  CanonicalContractManager,
  CanonicalApplicationContract,
} from "../canonical-contract.js";
import { ApiWorkflowVerifier } from "../../validation/api-workflow-verifier.js";
import { ApiContractRegistry } from "../../governance/api-contract-registry.js";
import { AuthorizedSchemaManager } from "../../governance/authorized-schema-manager.js";

const FIXTURE_ROOT = join(tmpdir(), "aegis_milestone2_fixtures_" + Date.now());

describe("Milestone 2 — Feature Matrix and Contract Alignment", () => {
  beforeEach(() => {
    if (existsSync(FIXTURE_ROOT)) rmSync(FIXTURE_ROOT, { recursive: true, force: true });
    mkdirSync(FIXTURE_ROOT, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(FIXTURE_ROOT)) rmSync(FIXTURE_ROOT, { recursive: true, force: true });
  });

  // ── 1. Requirements Authority (.aegis/feature-matrix.json) ─────────────────
  describe("1. Requirements Authority & FeatureMatrix Specification", () => {
    it("assigns deterministic stable IDs (F01, F02, ...) and validates correctly", () => {
      const matrix = FeatureMatrixManager.createMatrix("InventoryPro", "inventory-mgmt", [
        {
          title: "Product Catalog Management",
          description: "Browse, search, and manage products with real-time stock levels.",
          priority: "must-have",
          expectedBehavior: "User can see list of products and add new products with SKU and initial quantity.",
          routes: ["/products", "/inventory"],
          components: ["ProductTable", "AddProductModal"],
          apiEndpoints: [
            { method: "GET", path: "/api/products", expectedStatus: 200 },
            { method: "POST", path: "/api/products", expectedStatus: 201 },
          ],
          dataModels: [
            { model: "Product", fields: ["id", "name", "sku", "price", "quantity"] },
          ],
          validationRules: ["SKU must be unique", "Price must be positive"],
          acceptanceTests: [
            { testId: "test_product_creation", strategy: "api-integration", description: "Creates product and verifies stock" },
          ],
          verificationStatus: "UNVERIFIED",
        },
        {
          title: "Stock Audit Logs",
          description: "View historical stock adjustments and audit reasons.",
          priority: "should-have",
          expectedBehavior: "User can view logs of who adjusted stock.",
          routes: ["/inventory/audit"],
          components: ["AuditLogViewer"],
          apiEndpoints: [{ method: "GET", path: "/api/audit-logs", expectedStatus: 200 }],
          dataModels: [{ model: "StockAudit", fields: ["id", "productId", "change", "reason"] }],
          validationRules: [],
          acceptanceTests: [],
          verificationStatus: "UNVERIFIED",
        },
      ]);

      expect(matrix.features[0].id).toBe("F01");
      expect(matrix.features[1].id).toBe("F02");
      expect(matrix.totalFeatures).toBe(2);
      expect(matrix.mustHaveCount).toBe(1);
      expect(matrix.verifiedCount).toBe(0);

      const validation = FeatureMatrixManager.validate(matrix);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      // Save and reload from disk
      const saved = FeatureMatrixManager.saveToProject(FIXTURE_ROOT, matrix);
      expect(saved).toBe(true);

      const loaded = FeatureMatrixManager.loadFromProject(FIXTURE_ROOT);
      expect(loaded).not.toBeNull();
      expect(loaded?.features[0].title).toBe("Product Catalog Management");

      // Update status with evidence
      FeatureMatrixManager.updateFeatureStatus(loaded!, "F01", "VERIFIED", "Verified via vitest test_product_creation");
      expect(loaded?.verifiedCount).toBe(1);
      expect(loaded?.features[0].verificationStatus).toBe("VERIFIED");
      expect(loaded?.features[0].evidenceNotes).toContain("vitest");
    });

    it("rejects invalid matrix: missing required fields or must-have features without tests", () => {
      const invalidMatrix: any = {
        version: "1.0.0",
        projectName: "",
        domainName: "test",
        features: [
          {
            id: "INVALID_ID",
            title: "",
            description: "",
            priority: "must-have",
            expectedBehavior: "",
            routes: [],
            acceptanceTests: [], // Must-have requires acceptance tests
          },
        ],
      };

      const res = FeatureMatrixManager.validate(invalidMatrix);
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes("projectName"))).toBe(true);
      expect(res.errors.some(e => e.includes("Invalid feature ID format"))).toBe(true);
      expect(res.errors.some(e => e.includes("Must-have feature must define at least one acceptance test"))).toBe(true);
    });
  });

  // ── 2. Canonical Application Contracts & Alignment ─────────────────────────
  describe("2. Canonical Application Contracts & Traceability", () => {
    it("validates full alignment between FeatureMatrix, Routes, API Endpoints, Models, and Tests", () => {
      const contract: CanonicalApplicationContract = {
        contractVersion: "1.0.0",
        domain: "task-project-mgmt",
        applicationName: "ProjectTracker",
        features: FeatureMatrixManager.createMatrix("ProjectTracker", "task-project-mgmt", [
          {
            title: "Task Lifecycle Management",
            description: "Manage task creation, status updates, and priorities.",
            priority: "must-have",
            expectedBehavior: "User can create and transition task status.",
            routes: ["/tasks"],
            components: ["TaskBoard"],
            apiEndpoints: [
              { method: "GET", path: "/api/tasks", expectedStatus: 200 },
              { method: "POST", path: "/api/tasks", expectedStatus: 201 },
            ],
            dataModels: [
              { model: "Task", fields: ["id", "title", "status", "priority"] },
            ],
            validationRules: ["title is required", "status must be valid enum"],
            acceptanceTests: [
              { testId: "test_task_creation", strategy: "api-integration", description: "Verifies task creation" },
            ],
            verificationStatus: "UNVERIFIED",
          },
        ]),
        routes: [
          { path: "/tasks", name: "Tasks", title: "Task Management", component: "TasksPage", featureOwnership: "F01" },
        ],
        apiEndpoints: [
          {
            operationId: "getTasks",
            method: "GET",
            path: "/api/tasks",
            description: "List tasks",
            authentication: false,
            responseSchema: [{ name: "id", type: "string", required: true }],
            featureOwnership: "F01",
          },
          {
            operationId: "createTask",
            method: "POST",
            path: "/api/tasks",
            description: "Create a task",
            authentication: false,
            requestSchema: [
              { name: "title", type: "string", required: true },
              { name: "priority", type: "string", required: true },
            ],
            responseSchema: [{ name: "id", type: "string", required: true }],
            statusCodes: [201, 400],
            featureOwnership: "F01",
          },
        ],
        dataModels: [
          {
            name: "Task",
            fields: [
              { name: "id", type: "String", required: true, isId: true },
              { name: "title", type: "String", required: true },
              { name: "status", type: "String", required: true, defaultValue: "pending" },
              { name: "priority", type: "String", required: true },
            ],
            featureOwnership: "F01",
          },
        ],
        acceptanceTests: [
          {
            testId: "test_task_creation",
            featureId: "F01",
            strategy: "api-integration",
            targetRoute: "/tasks",
            targetEndpoint: { method: "POST", path: "/api/tasks" },
            description: "Tests task creation",
            assertions: ["res.status === 201", "res.body.id !== undefined"],
          },
        ],
      };

      const report = CanonicalContractManager.validate(contract);
      expect(report.valid).toBe(true);
      expect(report.errors).toHaveLength(0);
      expect(report.traceabilityCoverage.featureCoverage).toBe(1.0);
      expect(report.traceabilityCoverage.apiCoverage).toBe(1.0);
      expect(report.traceabilityCoverage.modelCoverage).toBe(1.0);
      expect(report.traceabilityCoverage.testCoverage).toBe(1.0);
    });

    it("computes accurate change impact blast radius when requirement changes", () => {
      const contract: CanonicalApplicationContract = {
        contractVersion: "1.0.0",
        domain: "sales-analytics",
        applicationName: "SalesPulse",
        features: FeatureMatrixManager.createMatrix("SalesPulse", "sales-analytics", [
          {
            title: "Revenue Tracking",
            description: "Pipeline and closed deal metrics.",
            priority: "must-have",
            expectedBehavior: "Track revenue.",
            routes: ["/analytics/revenue"],
            components: ["RevenueChart"],
            apiEndpoints: [{ method: "GET", path: "/api/analytics/revenue", expectedStatus: 200 }],
            dataModels: [{ model: "Deal", fields: ["id", "amount", "stage"] }],
            validationRules: [],
            acceptanceTests: [{ testId: "test_revenue_metrics", strategy: "api-integration", description: "Revenue metric test" }],
            verificationStatus: "UNVERIFIED",
          },
        ]),
        routes: [{ path: "/analytics/revenue", name: "Revenue", title: "Revenue", component: "RevenuePage" }],
        apiEndpoints: [{ operationId: "getRevenue", method: "GET", path: "/api/analytics/revenue", description: "Get revenue", authentication: false }],
        dataModels: [{ name: "Deal", fields: [{ name: "id", type: "String", required: true }, { name: "amount", type: "Float", required: true }, { name: "stage", type: "String", required: true }] }],
        acceptanceTests: [{ testId: "test_revenue_metrics", featureId: "F01", strategy: "api-integration", description: "Test", assertions: [] }],
      };

      const impact = CanonicalContractManager.analyzeChangeImpact(contract, "F01");
      expect(impact).not.toBeNull();
      expect(impact?.modifiedFeatureId).toBe("F01");
      expect(impact?.impactedRoutes).toContain("/analytics/revenue");
      expect(impact?.impactedEndpoints).toContain("GET /api/analytics/revenue");
      expect(impact?.impactedModels).toContain("Deal");
      expect(impact?.impactedTests).toContain("test_revenue_metrics");
      expect(impact?.mustRegenerate.frontendPages).toContain("src/pages/Analytics-revenuePage.tsx");
      expect(impact?.mustRegenerate.apiRoutes).toContain("server/routes/analytics.ts");
      expect(impact?.mustRegenerate.schemaModels).toContain("Deal");
      expect(impact?.mustRegenerate.testSuites).toContain("tests/test_revenue_metrics.test.ts");
    });
  });

  // ── 3. Contract-Driven API Verification (No Guesswork) ─────────────────────
  describe("3. Contract-Driven API Verification", () => {
    it("generates payloads derived from schema and respects endpoint-specific status codes", () => {
      ApiContractRegistry.registerContract([
        {
          operationId: "createOrder",
          method: "POST",
          path: "/api/orders",
          description: "Place a new customer order",
          authentication: true,
          statusCodes: [201, 400],
          requestSchema: [
            { name: "customerEmail", type: "string", required: true },
            { name: "totalAmount", type: "number", required: true },
            { name: "items", type: "string[]", required: true },
          ],
          responseSchema: [
            { name: "id", type: "string", required: true },
            { name: "status", type: "string", required: true },
          ],
        },
        {
          operationId: "cancelOrder",
          method: "DELETE",
          path: "/api/orders/:id",
          description: "Cancel an order",
          authentication: true,
          statusCodes: [204, 404],
        },
      ]);

      const steps = ApiWorkflowVerifier.generateWorkflowsFromContract();
      const posCreate = steps.find(s => s.workflowId.includes("wf_pos_createOrder"));
      expect(posCreate).toBeDefined();
      expect(posCreate?.expectedStatus).toBe(201);
      // Valid payload derived from schema:
      expect(posCreate?.requestBody).toBeDefined();
      expect(posCreate?.requestBody.customerEmail).toContain("@");
      expect(typeof posCreate?.requestBody.totalAmount).toBe("number");
      expect(Array.isArray(posCreate?.requestBody.items)).toBe(true);

      // DELETE expects 204 from statusCodes
      const posDelete = steps.find(s => s.workflowId.includes("wf_pos_cancelOrder"));
      expect(posDelete).toBeDefined();
      expect(posDelete?.expectedStatus).toBe(204);

      // Negative auth test generated
      const negAuth = steps.find(s => s.workflowId.includes("wf_neg_auth_createOrder"));
      expect(negAuth).toBeDefined();
      expect(negAuth?.expectedStatus).toBe(401);
    });
  });

  // ── 4 & 5. 5 Domain Regression Fixtures ────────────────────────────────────
  describe("5. 5 Domain Regression Fixtures & Schema Evolution Invariance", () => {
    it("Fixture 1: CRUD Inventory Application (inventory-mgmt)", () => {
      const projDir = join(FIXTURE_ROOT, "inv-app");
      mkdirSync(join(projDir, "prisma"), { recursive: true });

      const contract: CanonicalApplicationContract = {
        contractVersion: "1.0.0",
        domain: "inventory-mgmt",
        applicationName: "InventoryHub",
        features: FeatureMatrixManager.createMatrix("InventoryHub", "inventory-mgmt", [
          {
            title: "SKU Management",
            description: "Product inventory tracking",
            priority: "must-have",
            expectedBehavior: "List and add products with SKU and price",
            routes: ["/products"],
            components: ["ProductGrid"],
            apiEndpoints: [{ method: "POST", path: "/api/products", expectedStatus: 201 }],
            dataModels: [{ model: "Product", fields: ["id", "sku", "quantity", "unitPrice"] }],
            validationRules: ["sku unique"],
            acceptanceTests: [{ testId: "test_sku_creation", strategy: "api-integration", description: "Tests SKU creation" }],
            verificationStatus: "UNVERIFIED",
          },
        ]),
        routes: [{ path: "/products", name: "Products", title: "Products", component: "ProductsPage" }],
        apiEndpoints: [{ operationId: "addProduct", method: "POST", path: "/api/products", description: "Add product", authentication: false, statusCodes: [201] }],
        dataModels: [{ name: "Product", fields: [{ name: "id", type: "String", required: true }, { name: "sku", type: "String", required: true }, { name: "quantity", type: "Int", required: true }, { name: "unitPrice", type: "Float", required: true }] }],
        acceptanceTests: [{ testId: "test_sku_creation", featureId: "F01", strategy: "api-integration", description: "Test", assertions: [] }],
      };

      const res = CanonicalContractManager.validate(contract);
      expect(res.valid).toBe(true);

      // Reconcile to Prisma schema via AuthorizedSchemaManager
      CanonicalContractManager.syncToPrismaSchema(projDir, contract);
      const schema = readFileSync(join(projDir, "prisma", "schema.prisma"), "utf8");
      expect(schema).toContain("model Product");
      expect(schema).toMatch(/id\s+String\s+@id/);
    });

    it("Fixture 2: Task & Project Management (task-project-mgmt)", () => {
      const projDir = join(FIXTURE_ROOT, "task-app");
      mkdirSync(join(projDir, "prisma"), { recursive: true });

      const contract: CanonicalApplicationContract = {
        contractVersion: "1.0.0",
        domain: "task-project-mgmt",
        applicationName: "TaskFlow",
        features: FeatureMatrixManager.createMatrix("TaskFlow", "task-project-mgmt", [
          {
            title: "Task Coordination",
            description: "Task statuses and assignments",
            priority: "must-have",
            expectedBehavior: "Assign tasks and transition states",
            routes: ["/board"],
            components: ["KanbanBoard"],
            apiEndpoints: [{ method: "POST", path: "/api/tasks", expectedStatus: 201 }],
            dataModels: [{ model: "Task", fields: ["id", "title", "status", "priority"] }],
            validationRules: [],
            acceptanceTests: [{ testId: "test_task_transition", strategy: "api-integration", description: "State machine test" }],
            verificationStatus: "UNVERIFIED",
          },
        ]),
        routes: [{ path: "/board", name: "Board", title: "Board", component: "BoardPage" }],
        apiEndpoints: [{ operationId: "createTask", method: "POST", path: "/api/tasks", description: "Create task", authentication: false, statusCodes: [201] }],
        dataModels: [{ name: "Task", fields: [{ name: "id", type: "String", required: true }, { name: "title", type: "String", required: true }, { name: "status", type: "String", required: true }, { name: "priority", type: "String", required: true }] }],
        acceptanceTests: [{ testId: "test_task_transition", featureId: "F01", strategy: "api-integration", description: "Test", assertions: [] }],
      };

      expect(CanonicalContractManager.validate(contract).valid).toBe(true);
      CanonicalContractManager.syncToPrismaSchema(projDir, contract);
      const schema = readFileSync(join(projDir, "prisma", "schema.prisma"), "utf8");
      expect(schema).toContain("model Task");
    });

    it("Fixture 3: Sales Analytics Dashboard (sales-analytics)", () => {
      const projDir = join(FIXTURE_ROOT, "sales-app");
      mkdirSync(join(projDir, "prisma"), { recursive: true });

      const contract: CanonicalApplicationContract = {
        contractVersion: "1.0.0",
        domain: "sales-analytics",
        applicationName: "SalesMetrics",
        features: FeatureMatrixManager.createMatrix("SalesMetrics", "sales-analytics", [
          {
            title: "Pipeline Analytics",
            description: "Deal stages and volume",
            priority: "must-have",
            expectedBehavior: "View aggregated metrics",
            routes: ["/pipeline"],
            components: ["PipelineView"],
            apiEndpoints: [{ method: "GET", path: "/api/deals", expectedStatus: 200 }],
            dataModels: [{ model: "Deal", fields: ["id", "amount", "stage"] }],
            validationRules: [],
            acceptanceTests: [{ testId: "test_deal_metrics", strategy: "unit", description: "Aggregation unit test" }],
            verificationStatus: "UNVERIFIED",
          },
        ]),
        routes: [{ path: "/pipeline", name: "Pipeline", title: "Pipeline", component: "PipelinePage" }],
        apiEndpoints: [{ operationId: "getDeals", method: "GET", path: "/api/deals", description: "List deals", authentication: false }],
        dataModels: [{ name: "Deal", fields: [{ name: "id", type: "String", required: true }, { name: "amount", type: "Float", required: true }, { name: "stage", type: "String", required: true }] }],
        acceptanceTests: [{ testId: "test_deal_metrics", featureId: "F01", strategy: "unit", description: "Test", assertions: [] }],
      };

      expect(CanonicalContractManager.validate(contract).valid).toBe(true);
      CanonicalContractManager.syncToPrismaSchema(projDir, contract);
      const schema = readFileSync(join(projDir, "prisma", "schema.prisma"), "utf8");
      expect(schema).toContain("model Deal");
    });

    it("Fixture 4: Course and Student Management (course-student-mgmt)", () => {
      const projDir = join(FIXTURE_ROOT, "course-app");
      mkdirSync(join(projDir, "prisma"), { recursive: true });

      const contract: CanonicalApplicationContract = {
        contractVersion: "1.0.0",
        domain: "course-student-mgmt",
        applicationName: "AcademyPortal",
        features: FeatureMatrixManager.createMatrix("AcademyPortal", "course-student-mgmt", [
          {
            title: "Course Catalog",
            description: "Course enrollment and prerequisites",
            priority: "must-have",
            expectedBehavior: "Enroll students into courses",
            routes: ["/courses"],
            components: ["CourseList"],
            apiEndpoints: [{ method: "POST", path: "/api/enrollments", expectedStatus: 201 }],
            dataModels: [{ model: "Course", fields: ["id", "title", "credits"] }, { model: "Enrollment", fields: ["id", "courseId", "studentId", "status"] }],
            validationRules: [],
            acceptanceTests: [{ testId: "test_enrollment", strategy: "api-integration", description: "Enrollment test" }],
            verificationStatus: "UNVERIFIED",
          },
        ]),
        routes: [{ path: "/courses", name: "Courses", title: "Courses", component: "CoursesPage" }],
        apiEndpoints: [{ operationId: "enroll", method: "POST", path: "/api/enrollments", description: "Enroll", authentication: false, statusCodes: [201] }],
        dataModels: [
          { name: "Course", fields: [{ name: "id", type: "String", required: true }, { name: "title", type: "String", required: true }, { name: "credits", type: "Int", required: true }] },
          { name: "Enrollment", fields: [{ name: "id", type: "String", required: true }, { name: "courseId", type: "String", required: true }, { name: "studentId", type: "String", required: true }, { name: "status", type: "String", required: true }] },
        ],
        acceptanceTests: [{ testId: "test_enrollment", featureId: "F01", strategy: "api-integration", description: "Test", assertions: [] }],
      };

      expect(CanonicalContractManager.validate(contract).valid).toBe(true);
      CanonicalContractManager.syncToPrismaSchema(projDir, contract);
      const schema = readFileSync(join(projDir, "prisma", "schema.prisma"), "utf8");
      expect(schema).toContain("model Course");
      expect(schema).toContain("model Enrollment");
    });

    it("Fixture 5: Restaurant Ordering and Reservation (restaurant-ordering) preserving CartItem.customizations & Reservation.status", () => {
      const projDir = join(FIXTURE_ROOT, "restaurant-app");
      mkdirSync(join(projDir, "prisma"), { recursive: true });

      // Pre-existing schema with custom relations and CartItem customizations
      AuthorizedSchemaManager.reconcileAndWriteSchema(
        projDir,
        `datasource db {\n  provider = "postgresql"\n  url = env("DATABASE_URL")\n}\n\nmodel CartItem {\n  id String @id\n  customizations String\n  quantity Int\n  price Float\n}\n\nmodel Reservation {\n  id String @id\n  status String\n  partySize Int\n  guestName String\n}`,
        "SchemaEngine"
      );

      const contract: CanonicalApplicationContract = {
        contractVersion: "1.0.0",
        domain: "restaurant-ordering",
        applicationName: "SpiceBistro",
        features: FeatureMatrixManager.createMatrix("SpiceBistro", "restaurant-ordering", [
          {
            title: "Menu & Custom Ordering",
            description: "Custom orders with specific item options",
            priority: "must-have",
            expectedBehavior: "Order food with customizations",
            routes: ["/menu", "/order"],
            components: ["MenuCard", "CartDrawer"],
            apiEndpoints: [{ method: "POST", path: "/api/orders", expectedStatus: 201 }],
            dataModels: [
              { model: "CartItem", fields: ["id", "customizations", "quantity", "price"] },
            ],
            validationRules: ["customizations must be valid json string"],
            acceptanceTests: [{ testId: "test_custom_order", strategy: "api-integration", description: "Order customization test" }],
            verificationStatus: "UNVERIFIED",
          },
          {
            title: "Table Reservations",
            description: "Reserve tables with party size and time",
            priority: "must-have",
            expectedBehavior: "Book table",
            routes: ["/reservations"],
            components: ["BookingCalendar"],
            apiEndpoints: [{ method: "POST", path: "/api/reservations", expectedStatus: 201 }],
            dataModels: [
              { model: "Reservation", fields: ["id", "status", "partySize", "guestName"] },
            ],
            validationRules: ["partySize >= 1"],
            acceptanceTests: [{ testId: "test_reservation_booking", strategy: "api-integration", description: "Reservation test" }],
            verificationStatus: "UNVERIFIED",
          },
        ]),
        routes: [
          { path: "/menu", name: "Menu", title: "Menu", component: "MenuPage" },
          { path: "/order", name: "Order", title: "Order", component: "OrderPage" },
          { path: "/reservations", name: "Reservations", title: "Reservations", component: "ReservationsPage" },
        ],
        apiEndpoints: [
          { operationId: "createOrder", method: "POST", path: "/api/orders", description: "Create order", authentication: false, statusCodes: [201] },
          { operationId: "createReservation", method: "POST", path: "/api/reservations", description: "Create reservation", authentication: false, statusCodes: [201] },
        ],
        dataModels: [
          {
            name: "CartItem",
            fields: [
              { name: "id", type: "String", required: true },
              { name: "customizations", type: "String", required: true },
              { name: "quantity", type: "Int", required: true },
              { name: "price", type: "Float", required: true },
            ],
          },
          {
            name: "Reservation",
            fields: [
              { name: "id", type: "String", required: true },
              { name: "status", type: "String", required: true },
              { name: "partySize", type: "Int", required: true },
              { name: "guestName", type: "String", required: true },
            ],
          },
        ],
        acceptanceTests: [
          { testId: "test_custom_order", featureId: "F01", strategy: "api-integration", description: "Test", assertions: [] },
          { testId: "test_reservation_booking", featureId: "F02", strategy: "api-integration", description: "Test", assertions: [] },
        ],
      };

      expect(CanonicalContractManager.validate(contract).valid).toBe(true);

      // Verify schema sync preserves CartItem.customizations & Reservation.status
      CanonicalContractManager.syncToPrismaSchema(projDir, contract);
      const schema = readFileSync(join(projDir, "prisma", "schema.prisma"), "utf8");
      expect(schema).toContain("model CartItem");
      expect(schema).toContain("customizations String");
      expect(schema).toContain("model Reservation");
      expect(schema).toContain("status String");
      expect(schema).toContain("partySize Int");
    });
  });
});
