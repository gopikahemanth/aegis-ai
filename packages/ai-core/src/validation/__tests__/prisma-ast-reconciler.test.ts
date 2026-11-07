import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import ts from "typescript";
import { PrismaAstReconciler } from "../prisma-ast-reconciler.js";
import { ProjectGraphEngine } from "../project-graph-engine.js";

describe("Prisma AST Reconciler & Safe Graph Governance", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "aegis-prisma-ast-test-"));
    const prismaDir = join(tempDir, "prisma");
    mkdirSync(prismaDir, { recursive: true });

    // Canonical Appointment Booking Schema
    writeFileSync(join(prismaDir, "schema.prisma"), `
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
}

model Service {
  id              String   @id @default(uuid())
  name            String
  description     String
  durationMinutes Int      @default(30)
  price           Float    @default(0.0)
  category        String?
}

model ScheduleRule {
  id          String   @id @default(uuid())
  dayOfWeek   String
  startTime   String?
  endTime     String?
  isAvailable Boolean  @default(true)
}
`, "utf8");
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it("safely reconciles duration -> durationMinutes without regex corruption (no standalone '10),')", () => {
    const serverRoutes = join(tempDir, "server", "routes");
    mkdirSync(serverRoutes, { recursive: true });
    const serviceRoutePath = join(serverRoutes, "service.ts");

    // The exact defective code that previously got corrupted by regex
    const originalCode = `import { Router } from 'express';
import { prisma } from '../lib/prisma';
const router = Router();
router.post('/', async (req, res) => {
  const { name, description, price, duration, category } = req.body;
  const service = await prisma.service.create({
    data: {
      name,
      description,
      price: parseFloat(price),
      duration: parseInt(duration, 10),
      category,
    },
  });
  res.json(service);
});
export default router;
`;
    writeFileSync(serviceRoutePath, originalCode, "utf8");

    const engine = new ProjectGraphEngine();
    const result = engine.validateGraph(tempDir);

    const updatedCode = readFileSync(serviceRoutePath, "utf8");

    // 1. MUST NOT contain corrupted syntax "10)," on its own line
    expect(updatedCode).not.toMatch(/^[ \t]*10\),/m);

    // 2. MUST contain safely transformed property durationMinutes: parseInt(duration, 10)
    expect(updatedCode).toContain("durationMinutes: parseInt(duration, 10)");

    // 3. MUST be syntactically valid TypeScript
    const sf = ts.createSourceFile("service.ts", updatedCode, ts.ScriptTarget.Latest, true);
    const diags = (sf as any).parseDiagnostics || [];
    expect(diags.length).toBe(0);

    // 4. ProjectGraphEngine must report 0 PRISMA_SCHEMA_MISMATCH errors
    const schemaIssues = result.issues.filter(i => i.type === "PRISMA_SCHEMA_MISMATCH");
    expect(schemaIssues.length).toBe(0);
  });

  it("safely reconciles isWorkingDay -> isAvailable on ScheduleRule", () => {
    const serverRoutes = join(tempDir, "server", "routes");
    mkdirSync(serverRoutes, { recursive: true });
    const scheduleRoutePath = join(serverRoutes, "schedule.ts");

    const originalCode = `import { Router } from 'express';
import { prisma } from '../lib/prisma';
const router = Router();
router.post('/', async (req, res) => {
  const { dayOfWeek, startTime, endTime, isWorkingDay } = req.body;
  const rule = await prisma.scheduleRule.create({
    data: {
      dayOfWeek,
      startTime,
      endTime,
      isWorkingDay: Boolean(isWorkingDay),
    },
  });
  res.json(rule);
});
export default router;
`;
    writeFileSync(scheduleRoutePath, originalCode, "utf8");

    const engine = new ProjectGraphEngine();
    const result = engine.validateGraph(tempDir);

    const updatedCode = readFileSync(scheduleRoutePath, "utf8");

    expect(updatedCode).toContain("isAvailable: Boolean(isWorkingDay)");
    expect(updatedCode).not.toContain("isWorkingDay:");

    const sf = ts.createSourceFile("schedule.ts", updatedCode, ts.ScriptTarget.Latest, true);
    expect(((sf as any).parseDiagnostics || []).length).toBe(0);

    const schemaIssues = result.issues.filter(i => i.type === "PRISMA_SCHEMA_MISMATCH");
    expect(schemaIssues.length).toBe(0);
  });

  it("safely transforms shorthand property assignment { duration } -> { durationMinutes: duration }", () => {
    const serverRoutes = join(tempDir, "server", "routes");
    mkdirSync(serverRoutes, { recursive: true });
    const serviceRoutePath = join(serverRoutes, "service.ts");

    const originalCode = `import { Router } from 'express';
import { prisma } from '../lib/prisma';
const router = Router();
router.post('/', async (req, res) => {
  const { name, description, duration } = req.body;
  const service = await prisma.service.create({
    data: {
      name,
      description,
      duration,
    },
  });
  res.json(service);
});
export default router;
`;
    writeFileSync(serviceRoutePath, originalCode, "utf8");

    const models = PrismaAstReconciler.loadSchemaModels(tempDir);
    const { issues, transformed } = PrismaAstReconciler.reconcileSourceFile(serviceRoutePath, "server/routes/service.ts", models);

    expect(transformed).toBe(true);
    expect(issues.length).toBe(0);

    const updatedCode = readFileSync(serviceRoutePath, "utf8");
    expect(updatedCode).toContain("durationMinutes: duration");

    const sf = ts.createSourceFile("service.ts", updatedCode, ts.ScriptTarget.Latest, true);
    expect(((sf as any).parseDiagnostics || []).length).toBe(0);
  });

  it("NEVER deletes unknown fields with regex; reports structured diagnostic with location and expected schema", () => {
    const serverRoutes = join(tempDir, "server", "routes");
    mkdirSync(serverRoutes, { recursive: true });
    const serviceRoutePath = join(serverRoutes, "service.ts");

    const originalCode = `import { Router } from 'express';
import { prisma } from '../lib/prisma';
const router = Router();
router.post('/', async (req, res) => {
  const service = await prisma.service.create({
    data: {
      name: "Deluxe Service",
      unrecognizedCustomField: 999,
    },
  });
  res.json(service);
});
export default router;
`;
    writeFileSync(serviceRoutePath, originalCode, "utf8");

    const engine = new ProjectGraphEngine();
    const result = engine.validateGraph(tempDir);

    // 1. File content MUST NOT be silently stripped
    const currentCode = readFileSync(serviceRoutePath, "utf8");
    expect(currentCode).toContain("unrecognizedCustomField: 999");

    // 2. Structured diagnostic must identify model, field, location, and expected schema
    const schemaIssues = result.issues.filter(i => i.type === "PRISMA_SCHEMA_MISMATCH");
    expect(schemaIssues.length).toBeGreaterThan(0);
    const mismatch = schemaIssues.find(i => i.field === "unrecognizedCustomField");
    expect(mismatch).toBeDefined();
    expect(mismatch?.model).toBe("service");
    expect(mismatch?.line).toBe(8);
    expect(mismatch?.column).toBe(7);
    expect(mismatch?.expectedSchema).toContain("durationMinutes");
    expect(mismatch?.expectedSchema).toContain("name");
    expect(mismatch?.message).toContain('Model "service"');
    expect(mismatch?.message).toContain('unrecognizedCustomField');
  });

  it("preserves already-valid files without modification", () => {
    const serverRoutes = join(tempDir, "server", "routes");
    mkdirSync(serverRoutes, { recursive: true });
    const serviceRoutePath = join(serverRoutes, "service.ts");

    const validCode = `import { Router } from 'express';
import { prisma } from '../lib/prisma';
const router = Router();
router.post('/', async (req, res) => {
  const { name, description, price, durationMinutes } = req.body;
  const service = await prisma.service.create({
    data: {
      name,
      description,
      price: parseFloat(price),
      durationMinutes: parseInt(durationMinutes, 10),
    },
  });
  res.json(service);
});
export default router;
`;
    writeFileSync(serviceRoutePath, validCode, "utf8");

    const models = PrismaAstReconciler.loadSchemaModels(tempDir);
    const { issues, transformed } = PrismaAstReconciler.reconcileSourceFile(serviceRoutePath, "server/routes/service.ts", models);

    expect(transformed).toBe(false);
    expect(issues.length).toBe(0);
    expect(readFileSync(serviceRoutePath, "utf8")).toBe(validCode);
  });

  it("rolls back candidate code if AST transformation introduces syntax diagnostics", () => {
    const serverRoutes = join(tempDir, "server", "routes");
    mkdirSync(serverRoutes, { recursive: true });
    const brokenRoutePath = join(serverRoutes, "broken.ts");

    const malformedCode = `import { prisma } from '../lib/prisma';
prisma.service.create({ data: { duration: , name: "invalid" } });
`;
    writeFileSync(brokenRoutePath, malformedCode, "utf8");

    const models = PrismaAstReconciler.loadSchemaModels(tempDir);
    const { issues, transformed } = PrismaAstReconciler.reconcileSourceFile(brokenRoutePath, "server/routes/broken.ts", models);

    expect(transformed).toBe(false);
    expect(readFileSync(brokenRoutePath, "utf8")).toBe(malformedCode);
  });
});
