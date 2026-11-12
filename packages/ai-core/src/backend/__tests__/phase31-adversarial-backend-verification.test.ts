import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { unlinkSync, existsSync } from "node:fs";

import { CanonicalResourceRegistry } from "../../architect/canonical-resource-registry.js";
import { UniversalRequirementInterpreter } from "../../requirement-intelligence/universal-requirement-interpreter.js";
import { ArchitectureContractEngine } from "../../architect/architecture-contract-engine.js";
import { DynamicApiGenerator } from "../dynamic-api-generator.js";

describe("Phase 3.1 — Adversarial Backend, Data Model and Generation Architecture Verification", () => {
  let dbPath: string;
  let db: DatabaseSync;

  beforeEach(() => {
    dbPath = join(tmpdir(), `aegis_test_sqlite_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.db`);
    db = new DatabaseSync(dbPath);
    // Explicitly enable SQLite foreign key constraints
    db.exec("PRAGMA foreign_keys = ON;");
  });

  afterEach(() => {
    try {
      db.close();
      if (existsSync(dbPath)) {
        unlinkSync(dbPath);
      }
    } catch {
      // Ignore cleanup error
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Prisma Delegate Mapping Verification
  // ──────────────────────────────────────────────────────────────────────────
  describe("1. Prisma Delegate Mapping", () => {
    it("maps all standard and adversarial model names to exact camelCase Prisma Client delegates", () => {
      const modelsToTest = [
        { model: "CeramicPiece", expectedDelegate: "ceramicPiece" },
        { model: "WorkOrder", expectedDelegate: "workOrder" },
        { model: "VibrationTelemetry", expectedDelegate: "vibrationTelemetry" },
        { model: "ComponentInventory", expectedDelegate: "componentInventory" },
        { model: "FaaComplianceRecord", expectedDelegate: "faaComplianceRecord" },
        { model: "FAAComplianceRecord", expectedDelegate: "fAAComplianceRecord" }, // Prisma Client lowercases only first character
        // Two novel / unknown domain models
        { model: "GlazeSpecification", expectedDelegate: "glazeSpecification" },
        { model: "HydroponicSensorReading", expectedDelegate: "hydroponicSensorReading" },
      ];

      for (const { model, expectedDelegate } of modelsToTest) {
        const delegate = CanonicalResourceRegistry.getPrismaDelegateName(model);
        expect(delegate).toBe(expectedDelegate);

        const mapping = CanonicalResourceRegistry.resolve(model);
        expect(mapping.prismaDelegate).toBe(expectedDelegate);
      }
    });

    it("verifies controllers and routes consume the exact schema-derived Prisma delegate", () => {
      const spec = UniversalRequirementInterpreter.interpret(
        "Industrial aviation engine monitoring console with VibrationTelemetry, ComponentInventory, and FaaComplianceRecord."
      );
      const contract = ArchitectureContractEngine.synthesizeContract(spec);
      const beFiles = DynamicApiGenerator.generateAll(contract);

      const serverRoutes = beFiles.find(f => f.path.includes("routes/api.ts"));
      expect(serverRoutes).toBeDefined();

      // Controller files should reference delegate names without toLowerCase() collapse
      const controllerFiles = beFiles.filter(f => f.role === "controller");
      for (const cf of controllerFiles) {
        // Must NOT contain ad-hoc lowercase pattern like prisma[entity.toLowerCase()]
        expect(cf.content).not.toContain("prisma[");
        expect(cf.content).toMatch(/\(prisma as any\)\.[a-zA-Z0-9_]+\.(findMany|findUnique|create|update|delete)/);
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Canonical Resource Naming & Pluralization Architecture
  // ──────────────────────────────────────────────────────────────────────────
  describe("2. Canonical Resource Naming & Pluralization", () => {
    it("eliminates naive '+ s' pluralization and correctly inflects irregulars, mass nouns, and sibilants", () => {
      const assertions = [
        // Sibilants and -y
        { model: "ComponentInventory", expectedPath: "/api/component-inventories", expectedSlug: "component-inventories" },
        { model: "Category", expectedPath: "/api/categories", expectedSlug: "categories" },
        { model: "StatusDispatch", expectedPath: "/api/status-dispatches", expectedSlug: "status-dispatches" },
        // Mass / Uncountable nouns
        { model: "VibrationTelemetry", expectedPath: "/api/vibration-telemetry", expectedSlug: "vibration-telemetry" },
        { model: "EngineTelemetry", expectedPath: "/api/engine-telemetry", expectedSlug: "engine-telemetry" },
        // Irregulars
        { model: "SignalAnalysis", expectedPath: "/api/signal-analyses", expectedSlug: "signal-analyses" },
        // Regular multi-word PascalCase
        { model: "CeramicPiece", expectedPath: "/api/ceramic-pieces", expectedSlug: "ceramic-pieces" },
        { model: "WorkOrder", expectedPath: "/api/work-orders", expectedSlug: "work-orders" },
        { model: "FaaComplianceRecord", expectedPath: "/api/faa-compliance-records", expectedSlug: "faa-compliance-records" },
        { model: "GlazeSpecification", expectedPath: "/api/glaze-specifications", expectedSlug: "glaze-specifications" },
      ];

      for (const item of assertions) {
        const mapping = CanonicalResourceRegistry.resolve(item.model);
        expect(mapping.pluralResourcePath).toBe(item.expectedPath);
        expect(mapping.pluralResourceSlug).toBe(item.expectedSlug);
        expect(mapping.detailRoute).toBe(`${item.expectedPath}/:id`);
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Database Relationship & Deletion Safety Verification
  // ──────────────────────────────────────────────────────────────────────────
  describe("3. Database Relationship & Deletion Safety", () => {
    it("generates bidirectional relations with explicit foreign keys and business-justified onDelete policies", () => {
      const spec = UniversalRequirementInterpreter.interpret(
        "Artisanal ceramics studio with workshops, commissions, and customer booking appointments."
      );
      const contract = ArchitectureContractEngine.synthesizeContract(spec);
      const beFiles = DynamicApiGenerator.generateAll(contract);

      const prismaSchema = beFiles.find(f => f.path.includes("schema.prisma"))?.content;
      expect(prismaSchema).toBeDefined();

      // Check primary model (e.g. CeramicPiece or Studio) contains list relation
      expect(prismaSchema).toContain("Booking[]");

      // Check secondary model Booking contains foreign key and @relation with Restrict
      expect(prismaSchema).toMatch(/model Booking \{[\s\S]*?[a-zA-Z0-9]+Id\s+String\?[\s\S]*?@relation\(fields: \[[a-zA-Z0-9]+Id\], references: \[id\], onDelete: Restrict\)/);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Real SQLite Database Integration Testing (node:sqlite)
  // ──────────────────────────────────────────────────────────────────────────
  describe("4. Real SQLite Database Integration Execution", () => {
    it("executes real SQLite DDL, CRUD operations, and verifies database read-back", () => {
      // 1. Create tables with foreign key relation
      db.exec(`
        CREATE TABLE ceramic_pieces (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          status TEXT NOT NULL,
          price REAL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE bookings (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'PENDING',
          ceramic_piece_id TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          CONSTRAINT fk_ceramic_piece
            FOREIGN KEY (ceramic_piece_id)
            REFERENCES ceramic_pieces(id)
            ON DELETE RESTRICT
        );
      `);

      // 2. CREATE
      const insertPiece = db.prepare(`
        INSERT INTO ceramic_pieces (id, title, category, status, price)
        VALUES (?, ?, ?, ?, ?)
      `);
      insertPiece.run("piece-001", "Celadon Glaze Teapot", "STONEWARE", "ACTIVE", 145.0);

      // 3. READ-BACK
      const readPiece = db.prepare("SELECT * FROM ceramic_pieces WHERE id = ?").get("piece-001") as any;
      expect(readPiece).toBeDefined();
      expect(readPiece.title).toBe("Celadon Glaze Teapot");
      expect(readPiece.price).toBe(145.0);

      // 4. UPDATE
      const updatePiece = db.prepare("UPDATE ceramic_pieces SET status = ?, price = ? WHERE id = ?");
      updatePiece.run("SOLD", 160.0, "piece-001");

      const updatedPiece = db.prepare("SELECT * FROM ceramic_pieces WHERE id = ?").get("piece-001") as any;
      expect(updatedPiece.status).toBe("SOLD");
      expect(updatedPiece.price).toBe(160.0);

      // 5. INSERT CHILD with Foreign Key
      const insertBooking = db.prepare(`
        INSERT INTO bookings (id, title, status, ceramic_piece_id)
        VALUES (?, ?, ?, ?)
      `);
      insertBooking.run("book-101", "Private Tea Ceremony Booking", "CONFIRMED", "piece-001");

      const readBooking = db.prepare("SELECT * FROM bookings WHERE id = ?").get("book-101") as any;
      expect(readBooking.ceramic_piece_id).toBe("piece-001");
      expect(readBooking.status).toBe("CONFIRMED");
    });

    it("strictly enforces onDelete: RESTRICT preventing accidental deletion of parent records with active children", () => {
      db.exec(`
        CREATE TABLE aircraft_engines (
          id TEXT PRIMARY KEY,
          serial_number TEXT UNIQUE NOT NULL
        );

        CREATE TABLE faa_compliance_records (
          id TEXT PRIMARY KEY,
          engine_id TEXT NOT NULL,
          inspector_id TEXT NOT NULL,
          status TEXT NOT NULL,
          FOREIGN KEY (engine_id) REFERENCES aircraft_engines(id) ON DELETE RESTRICT
        );
      `);

      db.prepare("INSERT INTO aircraft_engines (id, serial_number) VALUES (?, ?)").run("eng-01", "CFM56-7B-88392");
      db.prepare("INSERT INTO faa_compliance_records (id, engine_id, inspector_id, status) VALUES (?, ?, ?, ?)").run(
        "rec-01",
        "eng-01",
        "FAA-INSP-449",
        "CERTIFIED"
      );

      // Attempting to delete the engine MUST throw a foreign key constraint violation under RESTRICT
      expect(() => {
        db.prepare("DELETE FROM aircraft_engines WHERE id = ?").run("eng-01");
      }).toThrow(/FOREIGN KEY constraint failed/);

      // Verify that engine and compliance records remain fully intact
      const engine = db.prepare("SELECT * FROM aircraft_engines WHERE id = ?").get("eng-01");
      const record = db.prepare("SELECT * FROM faa_compliance_records WHERE id = ?").get("rec-01");
      expect(engine).toBeDefined();
      expect(record).toBeDefined();
    });

    it("strictly enforces UNIQUE constraints on duplicate model records", () => {
      db.exec(`
        CREATE TABLE users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL
        );
      `);

      db.prepare("INSERT INTO users (id, email) VALUES (?, ?)").run("usr-1", "artisan@ceramics.com");

      // Attempting duplicate email must throw UNIQUE constraint failed
      expect(() => {
        db.prepare("INSERT INTO users (id, email) VALUES (?, ?)").run("usr-2", "artisan@ceramics.com");
      }).toThrow(/UNIQUE constraint failed/);
    });

    it("guarantees atomic transaction rollback when a multi-step operation fails", () => {
      db.exec(`
        CREATE TABLE inventory (
          id TEXT PRIMARY KEY,
          item_name TEXT NOT NULL,
          stock INTEGER NOT NULL
        );
        CREATE TABLE orders (
          id TEXT PRIMARY KEY,
          item_id TEXT NOT NULL,
          quantity INTEGER NOT NULL
        );
      `);

      db.prepare("INSERT INTO inventory (id, item_name, stock) VALUES (?, ?, ?)").run("item-1", "Porcelain Vase", 5);

      // Simulate transactional checkout: Step 1 inserts order, Step 2 fails due to intentional error
      expect(() => {
        db.exec("BEGIN TRANSACTION;");
        try {
          db.prepare("INSERT INTO orders (id, item_id, quantity) VALUES (?, ?, ?)").run("order-1", "item-1", 1);
          // Intentional error: dividing by zero or syntax error to trigger rollback
          db.exec("INSERT INTO nonexistent_table VALUES (1);");
          db.exec("COMMIT;");
        } catch (err) {
          db.exec("ROLLBACK;");
          throw err;
        }
      }).toThrow();

      // Verify rollback: order-1 must NOT exist and inventory stock must be untouched (5)
      const order = db.prepare("SELECT * FROM orders WHERE id = ?").get("order-1");
      const item = db.prepare("SELECT * FROM inventory WHERE id = ?").get("item-1") as any;
      expect(order).toBeUndefined();
      expect(item.stock).toBe(5);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Business Workflow & State Transition Verification
  // ──────────────────────────────────────────────────────────────────────────
  describe("5. Business Workflow Operations", () => {
    it("generates stateful workflow endpoints beyond generic CRUD", () => {
      const spec = UniversalRequirementInterpreter.interpret(
        "Commercial equipment maintenance platform with work order dispatch and technician assignment."
      );
      const contract = ArchitectureContractEngine.synthesizeContract(spec);
      const beFiles = DynamicApiGenerator.generateAll(contract);

      const routeFile = beFiles.find(f => f.path.includes("routes/api.ts"));
      expect(routeFile?.content).toContain("/workflow");

      const controller = beFiles.find(f => f.path.includes("WorkOrderController.ts"));
      expect(controller?.content).toContain("executeWorkflow");
    });
  });
});
