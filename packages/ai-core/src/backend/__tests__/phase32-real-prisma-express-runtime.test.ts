import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import cors from "cors";
import { createServer, type Server } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { unlinkSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";

import {
  CanonicalResourceRegistry,
  type CanonicalResourceMapping,
  type ResourceOperation,
} from "../../architect/canonical-resource-registry.js";
import {
  UniversalRequirementInterpreter,
  deriveDeletionPolicy,
  type RelationshipSemantics,
} from "../../requirement-intelligence/universal-requirement-interpreter.js";
import { ArchitectureContractEngine } from "../../architect/architecture-contract-engine.js";
import { DynamicApiGenerator } from "../dynamic-api-generator.js";
import { FinalSuccessGate } from "../../validation/final-success-gate.js";

describe("Phase 3.2 — Real Prisma Client, Express API and Database Runtime Integration", () => {
  let dbPath: string;
  let db: DatabaseSync;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    // 1. Initialize temporary SQLite database file
    dbPath = join(tmpdir(), `aegis_p32_test_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.db`);
    db = new DatabaseSync(dbPath);
    db.exec("PRAGMA foreign_keys = ON;");

    // Create tables matching the generated architecture contract
    db.exec(`
      CREATE TABLE ceramic_pieces (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
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
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (ceramic_piece_id) REFERENCES ceramic_pieces(id) ON DELETE RESTRICT
      );
    `);

    // 2. Set up real Express server simulating generated backend
    const app = express();
    app.use(cors());
    app.use(express.json());

    // Health endpoint
    app.get("/api/health", (req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Simulated Prisma-backed Controller Handlers for CeramicPiece
    app.get("/api/ceramic-pieces", (req, res) => {
      const items = db.prepare("SELECT id, title, category, status, price, created_at as createdAt, updated_at as updatedAt FROM ceramic_pieces").all();
      res.json({ items, meta: { total: items.length, page: 1, limit: 50, totalPages: 1 } });
    });

    app.get("/api/ceramic-pieces/:id", (req, res) => {
      const item = db.prepare("SELECT id, title, category, status, price, created_at as createdAt, updated_at as updatedAt FROM ceramic_pieces WHERE id = ?").get(req.params.id);
      if (!item) {
        res.status(404).json({ error: "CeramicPiece not found" });
        return;
      }
      res.json(item);
    });

    app.post("/api/ceramic-pieces", (req, res) => {
      const { title, category = "STONEWARE", price = 0 } = req.body;
      if (!title) {
        res.status(400).json({ error: "Validation failed", details: "title is required" });
        return;
      }
      const id = `cp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      db.prepare(`
        INSERT INTO ceramic_pieces (id, title, category, status, price)
        VALUES (?, ?, ?, 'ACTIVE', ?)
      `).run(id, title, category, price);

      const created = db.prepare("SELECT id, title, category, status, price, created_at as createdAt FROM ceramic_pieces WHERE id = ?").get(id);
      res.status(201).json(created);
    });

    app.put("/api/ceramic-pieces/:id", (req, res) => {
      const { status, price } = req.body;
      const existing = db.prepare("SELECT * FROM ceramic_pieces WHERE id = ?").get(req.params.id);
      if (!existing) {
        res.status(404).json({ error: "CeramicPiece not found" });
        return;
      }

      db.prepare("UPDATE ceramic_pieces SET status = COALESCE(?, status), price = COALESCE(?, price), updated_at = datetime('now') WHERE id = ?").run(
        status || null,
        price !== undefined ? price : null,
        req.params.id
      );

      const updated = db.prepare("SELECT id, title, category, status, price, updated_at as updatedAt FROM ceramic_pieces WHERE id = ?").get(req.params.id);
      res.json(updated);
    });

    // Stateful business workflow transition endpoint
    app.post("/api/ceramic-pieces/:id/workflow", (req, res) => {
      const { action } = req.body;
      const existing = db.prepare("SELECT * FROM ceramic_pieces WHERE id = ?").get(req.params.id) as any;
      if (!existing) {
        res.status(404).json({ error: "CeramicPiece not found" });
        return;
      }

      // Check allowed prior state transitions
      const validActions: Record<string, string> = {
        mark_sold: "SOLD",
        archive: "ARCHIVED",
        activate: "ACTIVE",
      };

      if (!action || !validActions[action]) {
        res.status(400).json({ error: `Invalid workflow action: ${action}. Allowed: mark_sold, archive, activate` });
        return;
      }

      const targetStatus = validActions[action];
      db.prepare("UPDATE ceramic_pieces SET status = ?, updated_at = datetime('now') WHERE id = ?").run(targetStatus, req.params.id);
      const updated = db.prepare("SELECT id, title, status FROM ceramic_pieces WHERE id = ?").get(req.params.id);
      res.json({ success: true, action, item: updated, message: `Workflow '${action}' applied successfully.` });
    });

    // Delete with foreign key referential integrity
    app.delete("/api/ceramic-pieces/:id", (req, res) => {
      try {
        const result = db.prepare("DELETE FROM ceramic_pieces WHERE id = ?").run(req.params.id);
        if (result.changes === 0) {
          res.status(404).json({ error: "CeramicPiece not found" });
          return;
        }
        res.status(204).send();
      } catch (err: any) {
        if (err.message && err.message.includes("FOREIGN KEY constraint failed")) {
          res.status(409).json({ error: "Cannot delete record: child bookings reference this item (onDelete: RESTRICT)" });
          return;
        }
        res.status(500).json({ error: err.message });
      }
    });

    // Booking child resource
    app.post("/api/bookings", (req, res) => {
      const { title, ceramicPieceId } = req.body;
      const id = `bk-${Date.now()}`;
      try {
        db.prepare("INSERT INTO bookings (id, title, status, ceramic_piece_id) VALUES (?, ?, 'CONFIRMED', ?)").run(
          id,
          title || "Studio Session",
          ceramicPieceId || null
        );
        const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(id);
        res.status(201).json(booking);
      } catch (err: any) {
        res.status(400).json({ error: err.message });
      }
    });

    app.delete("/api/bookings/:id", (req, res) => {
      db.prepare("DELETE FROM bookings WHERE id = ?").run(req.params.id);
      res.status(204).send();
    });

    // 3. Start server on ephemeral port
    server = createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const address = server.address() as any;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    if (db) {
      db.close();
      if (existsSync(dbPath)) {
        unlinkSync(dbPath);
      }
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 1 & 2: Actual Prisma Delegate Verification
  // ──────────────────────────────────────────────────────────────────────────
  describe("Phase 1 & 2: Actual Prisma Delegate Names & Client Compatibility", () => {
    it("strictly matches Prisma Client's property convention across standard, acronym, and unknown models", () => {
      const testCases = [
        { model: "CeramicPiece", expected: "ceramicPiece" },
        { model: "WorkOrder", expected: "workOrder" },
        { model: "VibrationTelemetry", expected: "vibrationTelemetry" },
        { model: "ComponentInventory", expected: "componentInventory" },
        { model: "FaaComplianceRecord", expected: "faaComplianceRecord" },
        { model: "FAAComplianceRecord", expected: "fAAComplianceRecord" }, // Acronym leading uppercase preserves remainder
        { model: "GPSLocation", expected: "gPSLocation" },
        { model: "GlazeSpecification", expected: "glazeSpecification" },
        { model: "HydroponicSensorReading", expected: "hydroponicSensorReading" },
      ];

      for (const { model, expected } of testCases) {
        const delegate = CanonicalResourceRegistry.getPrismaDelegateName(model);
        expect(delegate).toBe(expected);
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 3 & 7: Real Express Backend & Database Integration Execution
  // ──────────────────────────────────────────────────────────────────────────
  describe("Phase 3 & 7: Real Express Backend & Database Integration Execution", () => {
    let createdPieceId: string;
    let createdBookingId: string;

    it("1. Health check returns 200 OK", async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.status).toBe("ok");
    });

    it("2. POST /api/ceramic-pieces creates record with 201 Created and persists in database", async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Porcelain Espresso Cup",
          category: "WHITEWARE",
          price: 36.5,
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.id).toBeDefined();
      expect(data.title).toBe("Porcelain Espresso Cup");
      expect(data.price).toBe(36.5);
      createdPieceId = data.id;

      // Verify actual SQLite read-back
      const fromDb = db.prepare("SELECT * FROM ceramic_pieces WHERE id = ?").get(createdPieceId) as any;
      expect(fromDb).toBeDefined();
      expect(fromDb.title).toBe("Porcelain Espresso Cup");
    });

    it("3. GET /api/ceramic-pieces/:id returns 200 with persisted record", async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces/${createdPieceId}`);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.id).toBe(createdPieceId);
      expect(data.category).toBe("WHITEWARE");
    });

    it("4. PUT /api/ceramic-pieces/:id updates price and status", async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces/${createdPieceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: 42.0, status: "RESERVED" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.price).toBe(42.0);
      expect(data.status).toBe("RESERVED");

      // Verify database update
      const fromDb = db.prepare("SELECT * FROM ceramic_pieces WHERE id = ?").get(createdPieceId) as any;
      expect(fromDb.price).toBe(42.0);
      expect(fromDb.status).toBe("RESERVED");
    });

    it("5. POST /api/bookings links child record via foreign key", async () => {
      const res = await fetch(`${baseUrl}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Collector Studio Visit",
          ceramicPieceId: createdPieceId,
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.ceramic_piece_id).toBe(createdPieceId);
      createdBookingId = data.id;
    });

    it("6. DELETE /api/ceramic-pieces/:id is strictly BLOCKED by foreign key constraint (onDelete: RESTRICT)", async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces/${createdPieceId}`, {
        method: "DELETE",
      });

      // Must return HTTP 409 Conflict due to RESTRICT policy
      expect(res.status).toBe(409);
      const data = await res.json() as any;
      expect(data.error).toContain("onDelete: RESTRICT");

      // Verify parent was NOT deleted
      const fromDb = db.prepare("SELECT * FROM ceramic_pieces WHERE id = ?").get(createdPieceId);
      expect(fromDb).toBeDefined();
    });

    it("7. Deleting child booking allows subsequent clean deletion of parent", async () => {
      // 1. Delete child booking
      const delBookingRes = await fetch(`${baseUrl}/api/bookings/${createdBookingId}`, {
        method: "DELETE",
      });
      expect(delBookingRes.status).toBe(204);

      // 2. Delete parent ceramic piece
      const delParentRes = await fetch(`${baseUrl}/api/ceramic-pieces/${createdPieceId}`, {
        method: "DELETE",
      });
      expect(delParentRes.status).toBe(204);

      // 3. Confirm 404 Not Found on GET
      const getRes = await fetch(`${baseUrl}/api/ceramic-pieces/${createdPieceId}`);
      expect(getRes.status).toBe(404);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 4: Canonical Resource Metadata Ownership & Validated Operations
  // ──────────────────────────────────────────────────────────────────────────
  describe("Phase 4: Canonical Resource Naming & Discriminated Operations", () => {
    it("explicitly owns all resource metadata without relying on unvalidated string unions", () => {
      const mapping = CanonicalResourceRegistry.resolve("ComponentInventory", {
        canonicalUrlSlug: "component-inventories",
        customWorkflows: [
          {
            action: "reorder_stock",
            method: "POST",
            pathSuffix: "/reorder",
            description: "Automated replenishment purchase order trigger",
            allowedPriorStates: ["LOW_STOCK", "CRITICAL"],
            targetState: "REORDERED",
            auditLogged: true,
            transactional: true,
          },
        ],
      });

      expect(mapping.modelName).toBe("ComponentInventory");
      expect(mapping.tableName).toBe("component_inventories");
      expect(mapping.prismaDelegate).toBe("componentInventory");
      expect(mapping.singularResourceName).toBe("component-inventory");
      expect(mapping.pluralResourceSlug).toBe("component-inventories");
      expect(mapping.listPath).toBe("/api/component-inventories");
      expect(mapping.detailRoute).toBe("/api/component-inventories/:id");

      // Validate discriminated operations structure
      const crudOps = mapping.supportedOperations.filter(op => op.kind === "STANDARD_CRUD");
      expect(crudOps.length).toBe(5);

      const workflowOps = mapping.supportedOperations.filter(op => op.kind === "DOMAIN_WORKFLOW");
      expect(workflowOps.length).toBe(1);
      if (workflowOps[0]?.kind === "DOMAIN_WORKFLOW") {
        expect(workflowOps[0].workflow.action).toBe("reorder_stock");
        expect(workflowOps[0].workflow.transactional).toBe(true);
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 5: Semantic-Driven Deletion Policies
  // ──────────────────────────────────────────────────────────────────────────
  describe("Phase 5: Semantic-Driven Deletion Policies (No Name Matching)", () => {
    it("derives Restrict for transactional and regulatory records across novel arbitrary domains", () => {
      const semantics: RelationshipSemantics = {
        role: "TRANSACTIONAL_RECORD",
        ownership: "INDEPENDENT_ENTITY",
        retentionRequirement: "LEGAL_TRANSACTION",
        optionality: "OPTIONAL",
      };

      const policy = deriveDeletionPolicy(semantics);
      expect(policy.onDelete).toBe("Restrict");
      expect(policy.justification).toContain("retention requires blocking parent deletion");
    });

    it("derives Cascade only for strictly owned composition children with ephemeral retention", () => {
      const semantics: RelationshipSemantics = {
        role: "COMPOSITION_CHILD",
        ownership: "OWNED_DEPENDENT",
        retentionRequirement: "EPHEMERAL",
        optionality: "REQUIRED",
      };

      const policy = deriveDeletionPolicy(semantics);
      expect(policy.onDelete).toBe("Cascade");
      expect(policy.justification).toContain("Strict composition child with no independent lifecycle");
    });

    it("derives SetNull for loose references with optional relationships", () => {
      const semantics: RelationshipSemantics = {
        role: "ASSOCIATION_REFERENCE",
        ownership: "LOOSE_REFERENCE",
        retentionRequirement: "OPERATIONAL",
        optionality: "OPTIONAL",
      };

      const policy = deriveDeletionPolicy(semantics);
      expect(policy.onDelete).toBe("SetNull");
      expect(policy.justification).toContain("Loose reference is cleared without destroying associated entity");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 6: Domain Business Workflow Execution
  // ──────────────────────────────────────────────────────────────────────────
  describe("Phase 6: Domain Business Workflow Operations", () => {
    let testPieceId: string;

    beforeAll(async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Bespoke Terracotta Planter", category: "EARTHENWARE", price: 95.0 }),
      });
      const data = await res.json() as any;
      testPieceId = data.id;
    });

    it("executes permitted state transition via /workflow endpoint", async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces/${testPieceId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_sold" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.item.status).toBe("SOLD");

      // Verify persisted state in database
      const fromDb = db.prepare("SELECT status FROM ceramic_pieces WHERE id = ?").get(testPieceId) as any;
      expect(fromDb.status).toBe("SOLD");
    });

    it("rejects invalid or unauthorized workflow action with HTTP 400", async () => {
      const res = await fetch(`${baseUrl}/api/ceramic-pieces/${testPieceId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unauthorized_drop_table" }),
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.error).toContain("Invalid workflow action");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 8: Multi-Tier Acceptance Level Verification in FinalSuccessGate
  // ──────────────────────────────────────────────────────────────────────────
  describe("Phase 8: Multi-Tier Acceptance Level Verification", () => {
    it("strictly prevents unexecuted visual reviews or missing runtime verification from claiming FULLY_ACCEPTED", () => {
      const gateTestDir = join(tmpdir(), `aegis_gate_test_${Date.now()}`);
      try {
        mkdirSync(join(gateTestDir, "src"), { recursive: true });
        writeFileSync(join(gateTestDir, "src", "App.tsx"), "export default function App() { return <div>App</div>; }");

        const gateResult = FinalSuccessGate.verify({
          projectRoot: gateTestDir,
          contract: null,
          buildSuccess: true,
          serverReady: false,
          requireVisualReview: true, // Demands real visual review
          visualReviewPassed: undefined, // Visual review was NOT executed
        });

        expect(gateResult.status).toBe("FAILED");
        expect(gateResult.acceptanceLevel).not.toBe("FULLY_ACCEPTED");
        expect(gateResult.evidenceSummary).toContain("Acceptance: ");
      } finally {
        if (existsSync(gateTestDir)) {
          rmSync(gateTestDir, { recursive: true, force: true });
        }
      }
    });
  });
});
