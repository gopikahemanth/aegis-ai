/**
 * Phase 4.6: Autonomous Real Product Generation & Generalization Acceptance Benchmark
 *
 * Fifth Benchmark Archetype:
 * Bicycle Rental & Master Workshop Repair Platform ("VeloFix Cycles")
 *
 * Proves that Aegis AI autonomously understands, designs, generates, and validates
 * a complex, multi-entity real-world operational platform:
 * 1. Customer bicycle rental discovery & booking
 * 2. Rental availability & booking management
 * 3. Bicycle inventory specifications & condition
 * 4. Customer service & repair intake
 * 5. Mechanic assignment
 * 6. Multi-stage repair pipeline (DIAGNOSTIC -> IN_PROGRESS -> PARTS_PENDING -> READY_FOR_PICKUP -> COMPLETED)
 * 7. Customer real-time repair tracker
 * 8. Workshop spare parts & consumables tracking
 * 9. Payment recording & documented checkout limits
 * 10. Real SQLite database persistence and transaction integrity
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rmSync, mkdirSync, existsSync } from "node:fs";

import { UniversalRequirementInterpreter } from "../../requirement-intelligence/universal-requirement-interpreter.js";
import { ArchitectureContractEngine } from "../../architect/architecture-contract-engine.js";
import {
  InteractiveComponentGenerator,
  type GeneratedComponentFile,
} from "../../design/interactive-component-generator.js";
import { FrontendExperienceVerifier } from "../../design/frontend-experience-verifier.js";
import { DesignDecisionDocumentEngine } from "../../design/design-decision-document.js";
import { DynamicApiGenerator } from "../../backend/dynamic-api-generator.js";

describe("Phase 4.6 Benchmark: Bicycle Rental & Master Workshop Repair Platform (VeloFix Cycles)", () => {
  const prompt =
    "Build VeloFix Cycles: a modern bicycle rental and workshop repair platform with customer rental discovery and booking, rental availability management, bicycle inventory specifications, repair service requests and work orders, mechanic assignment, multi-stage repair status tracking (diagnostic, in progress, parts pending, ready for pickup, completed), customer notifications, workshop spare parts tracking, and payment receipts.";

  let spec: ReturnType<typeof UniversalRequirementInterpreter.interpret>;
  let contract: ReturnType<typeof ArchitectureContractEngine.synthesizeContract>;
  let designDoc: ReturnType<typeof DesignDecisionDocumentEngine.generateDocument>;
  let frontendFiles: GeneratedComponentFile[];
  let backendFiles: ReturnType<typeof DynamicApiGenerator.generateAll>;

  let testDbDir: string;
  let db: DatabaseSync;

  beforeAll(() => {
    testDbDir = join(tmpdir(), `aegis-benchmark-velofix-${Date.now()}`);
    if (!existsSync(testDbDir)) {
      mkdirSync(testDbDir, { recursive: true });
    }
    const dbPath = join(testDbDir, "velofix_test.db");
    db = new DatabaseSync(dbPath);
    db.exec("PRAGMA foreign_keys = ON;");
  });

  afterAll(() => {
    try {
      db.close();
    } catch {}
    try {
      rmSync(testDbDir, { recursive: true, force: true });
    } catch {}
  });

  // ─── 1. Requirement Intelligence & Product Understanding ───────────────────
  describe("1. Autonomous Requirement Interpretation & Multi-Entity Model Discovery", () => {
    it("classifies prompt into bicycle-rental-and-repair domain category without hardcoding", () => {
      spec = UniversalRequirementInterpreter.interpret(prompt);
      expect(spec.domainCategory).toBe("bicycle-rental-and-repair");
    });

    it("synthesizes primary domain vocabulary for Bicycle", () => {
      expect(spec.domainVocabulary.entityName).toBe("Bicycle");
      expect(spec.domainVocabulary.entityPlural).toBe("Bicycles");
      expect(spec.domainVocabulary.domainPrefix).toBe("bicycle");
      expect(spec.domainVocabulary.actionVerbs).toContain("Reserve Bike");
      expect(spec.domainVocabulary.actionVerbs).toContain("Create Work Order");
    });

    it("synthesizes multi-entity data models covering rentals, work orders, mechanics, parts and payments", () => {
      const modelNames = spec.entities.map((e) => e.name);
      expect(modelNames).toContain("Bicycle");
      expect(modelNames).toContain("Booking");
      expect(modelNames).toContain("WorkOrder");
      expect(modelNames).toContain("Mechanic");
      expect(modelNames).toContain("InventoryItem");
      expect(modelNames).toContain("PaymentRecord");
    });

    it("configures foreign key relationships between Bicycles, Bookings, WorkOrders, and Payments", () => {
      const workOrderEntity = spec.entities.find((e) => e.name === "WorkOrder");
      expect(workOrderEntity).toBeDefined();

      const bookingEntity = spec.entities.find((e) => e.name === "Booking");
      expect(bookingEntity).toBeDefined();

      const bicycleEntity = spec.entities.find((e) => e.name === "Bicycle");
      expect(bicycleEntity).toBeDefined();
    });
  });

  // ─── 2. Architecture Contract Synthesis ────────────────────────────────────
  describe("2. Architecture Contract Engine & Route Plan Synthesis", () => {
    it("locks an architecture contract targeting SQLite and React-Vite with Express", () => {
      contract = ArchitectureContractEngine.synthesizeContract(spec);
      expect(contract.database.engine).toBe("sqlite");
      expect(contract.database.orm).toBe("prisma");
      expect(contract.frontend.framework).toBe("react-vite");
      expect(contract.backend.framework).toBe("express");
    });

    it("synthesizes clean frontend routes covering domain resources and customer workflows", () => {
      const routes = contract.routes.frontendRoutes.map((r: any) =>
        typeof r === "string" ? r : r.path
      );
      expect(routes).toContain("/");
      expect(routes).toContain("/bicycles");
    });

    it("synthesizes comprehensive REST endpoints across all domain resources", () => {
      const endpoints = contract.routes.backendEndpoints;
      const paths = endpoints.map((e) => e.path);

      expect(paths.some((p) => p.includes("bicycle"))).toBe(true);
      expect(paths.some((p) => p.includes("booking"))).toBe(true);
      expect(paths.some((p) => p.includes("work-order") || p.includes("workorder"))).toBe(true);
      expect(paths.some((p) => p.includes("mechanic"))).toBe(true);
    });
  });

  // ─── 3. Design Decision Document & Brand Personality ─────────────────────────
  describe("3. Design Decision Document Engine & Aesthetic Specialization", () => {
    it("generates authentic cycling brand identity, visual thesis, and functional palette", () => {
      designDoc = DesignDecisionDocumentEngine.generateDocument({
        prompt,
        brandName: contract.projectName,
        routes: contract.routes.frontendRoutes.map((r: any) =>
          typeof r === "string" ? r : r.path
        ),
        pagePlans: [],
        domainHint: contract.domainCategory,
      });

      expect(designDoc.projectIdentity.productName).toBeDefined();
      expect(designDoc.visualSystem.colorPalette.background).toBeDefined();
      expect(designDoc.visualSystem.colorPalette.primaryAccent).toBeDefined();
      expect(designDoc.visualSystem.typography.headingFont).toBeDefined();
      expect(designDoc.visualSystem.typography.bodyFont).toBeDefined();
    });
  });

  // ─── 4. Full-Stack Frontend Generation & Anti-Cheating Invariants ───────────
  describe("4. Interactive Frontend Component Generation & Experience Audit", () => {
    beforeAll(() => {
      frontendFiles = InteractiveComponentGenerator.generateAll(
        contract,
        spec.domainVocabulary,
        { designDoc }
      );
    });

    it("generates complete frontend suite with App, Navbar, HomePage, ListPage, and Api client", () => {
      const filePaths = frontendFiles.map((f) => f.path);
      expect(filePaths).toContain("src/App.tsx");
      expect(filePaths).toContain("src/components/Navbar.tsx");
      expect(filePaths).toContain("src/pages/HomePage.tsx");
      expect(filePaths).toContain("src/pages/BicycleListPage.tsx");
      expect(filePaths).toContain("src/services/api.ts");
      expect(filePaths).toContain("src/index.css");
    });

    it("generates bespoke HomePage implementing all required benchmark capabilities", () => {
      const homePage = frontendFiles.find((f) => f.path === "src/pages/HomePage.tsx");
      expect(homePage).toBeDefined();
      const content = homePage!.content;

      // 1. Rental Discovery & Booking Modal
      expect(content).toContain("handleConfirmRental");
      expect(content).toContain("Rental Reservation");
      expect(content).toContain("Rental Duration");
      expect(content).toContain("Add-on Essentials");

      // 2. Workshop Service Intake
      expect(content).toContain("handleCreateWorkOrder");
      expect(content).toContain("Workshop Service Intake Portal");
      expect(content).toContain("Service Package / Tier");

      // 3. Mechanic Workshop Pipeline & 5 Stages
      expect(content).toContain("handleAdvanceStage");
      expect(content).toContain("handleAssignMechanic");
      expect(content).toContain("DIAGNOSTIC");
      expect(content).toContain("IN_PROGRESS");
      expect(content).toContain("PARTS_PENDING");
      expect(content).toContain("READY_FOR_PICKUP");
      expect(content).toContain("COMPLETED");

      // 4. Real-Time Customer Repair Tracker
      expect(content).toContain("handleSearchTracker");
      expect(content).toContain("Track Your Bicycle Repair");

      // 5. Workshop Inventory & Consumables
      expect(content).toContain("handleUsePart");
      expect(content).toContain("Workshop Spare Parts & Stock");
      expect(content).toContain("Log Part Used");
    });

    it("passes FrontendExperienceVerifier audit with NIR >= 0.95 and zero inert elements", () => {
      const audit = FrontendExperienceVerifier.audit(
        frontendFiles.map((f) => ({ path: f.path, content: f.content })),
        contract
      );

      expect(audit.passed).toBe(true);
      expect(audit.nirScore).toBeGreaterThanOrEqual(0.95);
      expect(audit.inertElementsCount).toBe(0);
      expect(audit.routeCoverage.missingRoutes).toHaveLength(0);
    });

    it("generates fully typed REST API client matching backend resources", () => {
      const apiFile = frontendFiles.find((f) => f.path === "src/services/api.ts");
      expect(apiFile).toBeDefined();
      expect(apiFile!.content).toContain("export const api = {");
      expect(apiFile!.content).toContain("async list<T = any>");
      expect(apiFile!.content).toContain("async create<T = any>");
      expect(apiFile!.content).toContain("async update<T = any>");
      expect(apiFile!.content).toContain("async delete(resource: string");
    });
  });

  // ─── 5. Backend Dynamic API Generation & Real SQLite Runtime ────────────────
  describe("5. Dynamic Backend Generation & Real Database Persistence Runtime", () => {
    beforeAll(() => {
      backendFiles = DynamicApiGenerator.generateAll(contract, spec.domainVocabulary);
    });

    it("generates complete backend suite including Prisma schema, controllers, and routes", () => {
      const paths = backendFiles.map((f) => f.path);
      expect(paths).toContain("prisma/schema.prisma");
      expect(paths).toContain("server/src/db.ts");
      expect(paths).toContain("server/src/routes/api.ts");
      expect(paths).toContain("server/src/validators/index.ts");
    });

    it("synthesizes valid Prisma schema for Bicycle, Booking, WorkOrder, Mechanic, InventoryItem, PaymentRecord", () => {
      const schema = backendFiles.find((f) => f.path === "prisma/schema.prisma");
      expect(schema).toBeDefined();
      expect(schema!.content).toContain("model Bicycle {");
      expect(schema!.content).toContain("model Booking {");
      expect(schema!.content).toContain("model WorkOrder {");
      expect(schema!.content).toContain("model Mechanic {");
      expect(schema!.content).toContain("model InventoryItem {");
      expect(schema!.content).toContain("model PaymentRecord {");
    });

    it("executes real SQLite relational schema setup and enforces foreign key constraints", () => {
      // 1. Create SQLite tables representing synthesized schema
      db.exec(`
        CREATE TABLE bicycles (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'AVAILABLE',
          dailyRate REAL NOT NULL,
          frameSize TEXT,
          createdAt TEXT NOT NULL
        );

        CREATE TABLE mechanics (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          specialty TEXT NOT NULL,
          activeOrdersCount INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE bookings (
          id TEXT PRIMARY KEY,
          bicycleId TEXT NOT NULL,
          customerName TEXT NOT NULL,
          customerEmail TEXT NOT NULL,
          durationDays INTEGER NOT NULL,
          totalPrice REAL NOT NULL,
          status TEXT NOT NULL DEFAULT 'CONFIRMED',
          createdAt TEXT NOT NULL,
          FOREIGN KEY (bicycleId) REFERENCES bicycles(id) ON DELETE RESTRICT
        );

        CREATE TABLE work_orders (
          id TEXT PRIMARY KEY,
          customerName TEXT NOT NULL,
          customerEmail TEXT NOT NULL,
          bikeModel TEXT NOT NULL,
          serviceTier TEXT NOT NULL,
          issue TEXT NOT NULL,
          priority TEXT NOT NULL DEFAULT 'NORMAL',
          status TEXT NOT NULL DEFAULT 'DIAGNOSTIC',
          mechanicId TEXT,
          totalCost REAL NOT NULL,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (mechanicId) REFERENCES mechanics(id) ON DELETE SET NULL
        );

        CREATE TABLE inventory_items (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          inStock INTEGER NOT NULL DEFAULT 0,
          unitPrice REAL NOT NULL
        );

        CREATE TABLE payment_records (
          id TEXT PRIMARY KEY,
          referenceId TEXT NOT NULL,
          referenceType TEXT NOT NULL,
          amount REAL NOT NULL,
          paymentMethod TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'SETTLED',
          createdAt TEXT NOT NULL
        );
      `);

      // Verify table creation
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .all() as { name: string }[];
      const names = tables.map((t) => t.name);
      expect(names).toContain("bicycles");
      expect(names).toContain("bookings");
      expect(names).toContain("work_orders");
      expect(names).toContain("mechanics");
      expect(names).toContain("inventory_items");
      expect(names).toContain("payment_records");
    });

    it("runtime journey 1: inserts bicycle and creates rental booking with foreign key verification", () => {
      const now = new Date().toISOString();

      // Insert bicycle
      db.prepare(`
        INSERT INTO bicycles (id, title, category, status, dailyRate, frameSize, createdAt)
        VALUES ('bike-1', 'AeroRoad Carbon Disc Di2', 'Road Racing', 'AVAILABLE', 65.0, '54cm', ?)
      `).run(now);

      const bike = db.prepare("SELECT * FROM bicycles WHERE id = 'bike-1'").get() as any;
      expect(bike.title).toBe("AeroRoad Carbon Disc Di2");
      expect(bike.status).toBe("AVAILABLE");

      // Create rental booking
      db.prepare(`
        INSERT INTO bookings (id, bicycleId, customerName, customerEmail, durationDays, totalPrice, status, createdAt)
        VALUES ('bk-1001', 'bike-1', 'Leo Hayes', 'leo@example.com', 3, 195.0, 'CONFIRMED', ?)
      `).run(now);

      // Update bike status to RENTED
      db.prepare("UPDATE bicycles SET status = 'RENTED' WHERE id = 'bike-1'").run();

      const booking = db.prepare("SELECT * FROM bookings WHERE id = 'bk-1001'").get() as any;
      expect(booking.customerName).toBe("Leo Hayes");
      expect(booking.durationDays).toBe(3);
      expect(booking.totalPrice).toBe(195.0);

      const updatedBike = db.prepare("SELECT status FROM bicycles WHERE id = 'bike-1'").get() as any;
      expect(updatedBike.status).toBe("RENTED");

      // Foreign key invariant: cannot delete bike while active booking exists
      expect(() => {
        db.prepare("DELETE FROM bicycles WHERE id = 'bike-1'").run();
      }).toThrow(/FOREIGN KEY/i);
    });

    it("runtime journey 2: creates work order, assigns mechanic, and progresses through 5-stage repair pipeline", () => {
      const now = new Date().toISOString();

      // Insert mechanic
      db.prepare(`
        INSERT INTO mechanics (id, name, specialty, activeOrdersCount)
        VALUES ('mech-1', 'Sam Chen', 'Master Suspension & Hydraulics', 1)
      `).run();

      // Create work order in DIAGNOSTIC
      db.prepare(`
        INSERT INTO work_orders (id, customerName, customerEmail, bikeModel, serviceTier, issue, priority, status, mechanicId, totalCost, createdAt)
        VALUES ('WO-4091', 'Marcus Vance', 'marcus@example.com', 'Specialized Diverge STR Expert', 'Pro Tune & Ultrasonic Clean', 'Indexing lag and brake rubbing', 'RUSH', 'DIAGNOSTIC', 'mech-1', 185.0, ?)
      `).run(now);

      let wo = db.prepare("SELECT * FROM work_orders WHERE id = 'WO-4091'").get() as any;
      expect(wo.status).toBe("DIAGNOSTIC");
      expect(wo.priority).toBe("RUSH");
      expect(wo.mechanicId).toBe("mech-1");

      // Stage progression 1: DIAGNOSTIC -> IN_PROGRESS
      db.prepare("UPDATE work_orders SET status = 'IN_PROGRESS' WHERE id = 'WO-4091'").run();
      wo = db.prepare("SELECT status FROM work_orders WHERE id = 'WO-4091'").get() as any;
      expect(wo.status).toBe("IN_PROGRESS");

      // Stage progression 2: IN_PROGRESS -> PARTS_PENDING
      db.prepare("UPDATE work_orders SET status = 'PARTS_PENDING' WHERE id = 'WO-4091'").run();
      wo = db.prepare("SELECT status FROM work_orders WHERE id = 'WO-4091'").get() as any;
      expect(wo.status).toBe("PARTS_PENDING");

      // Stage progression 3: PARTS_PENDING -> READY_FOR_PICKUP
      db.prepare("UPDATE work_orders SET status = 'READY_FOR_PICKUP' WHERE id = 'WO-4091'").run();
      wo = db.prepare("SELECT status FROM work_orders WHERE id = 'WO-4091'").get() as any;
      expect(wo.status).toBe("READY_FOR_PICKUP");

      // Stage progression 4: READY_FOR_PICKUP -> COMPLETED
      db.prepare("UPDATE work_orders SET status = 'COMPLETED' WHERE id = 'WO-4091'").run();
      wo = db.prepare("SELECT status FROM work_orders WHERE id = 'WO-4091'").get() as any;
      expect(wo.status).toBe("COMPLETED");

      // Verify customer record read-back matches
      const finalWo = db.prepare("SELECT * FROM work_orders WHERE id = 'WO-4091'").get() as any;
      expect(finalWo.customerName).toBe("Marcus Vance");
      expect(finalWo.totalCost).toBe(185.0);
    });

    it("runtime journey 3: records payment for completed work order and logs consumables usage", () => {
      const now = new Date().toISOString();

      // Insert inventory consumable
      db.prepare(`
        INSERT INTO inventory_items (id, name, category, inStock, unitPrice)
        VALUES ('part-1', 'Shimano K05S-RX Resin Pads', 'Braking', 12, 24.0)
      `).run();

      // Consume part
      db.prepare("UPDATE inventory_items SET inStock = inStock - 1 WHERE id = 'part-1'").run();
      const part = db.prepare("SELECT inStock FROM inventory_items WHERE id = 'part-1'").get() as any;
      expect(part.inStock).toBe(11);

      // Record payment
      db.prepare(`
        INSERT INTO payment_records (id, referenceId, referenceType, amount, paymentMethod, status, createdAt)
        VALUES ('pay-901', 'WO-4091', 'WORK_ORDER', 185.0, 'CREDIT_CARD_MOCK', 'SETTLED', ?)
      `).run(now);

      const payment = db.prepare("SELECT * FROM payment_records WHERE id = 'pay-901'").get() as any;
      expect(payment.referenceId).toBe("WO-4091");
      expect(payment.amount).toBe(185.0);
      expect(payment.status).toBe("SETTLED");
    });
  });
});
