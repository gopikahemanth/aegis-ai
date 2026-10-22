import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { AuthorizedSchemaManager } from "../authorized-schema-manager.js";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const FIXTURE_DIR = join(process.cwd(), "scratch", "test-schema-manager-fixture");
const PRISMA_SCHEMA_PATH = join(FIXTURE_DIR, "prisma", "schema.prisma");

describe("AuthorizedSchemaManager — Milestone 1 Authoritative Schema Evolution", () => {
  beforeEach(() => {
    rmSync(FIXTURE_DIR, { recursive: true, force: true });
    mkdirSync(join(FIXTURE_DIR, "prisma"), { recursive: true });
  });

  afterEach(() => {
    rmSync(FIXTURE_DIR, { recursive: true, force: true });
  });

  it("1. Authorized schema update can modify an existing schema", () => {
    const initialSchema = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id    String @id @default(uuid())
  email String @unique
}
`;
    writeFileSync(PRISMA_SCHEMA_PATH, initialSchema, "utf8");

    const newSchema = `
model MenuItem {
  id    String @id @default(uuid())
  name  String
  price Float
}
`;
    const res = AuthorizedSchemaManager.reconcileAndWriteSchema(
      FIXTURE_DIR,
      newSchema,
      "DatabaseAgent"
    );

    expect(res.success).toBe(true);
    expect(res.written).toBe(true);

    const onDisk = readFileSync(PRISMA_SCHEMA_PATH, "utf8");
    expect(onDisk).toContain("model User");
    expect(onDisk).toContain("model MenuItem");
  });

  it("2. Required domain fields survive reconciliation (CartItem.customizations & Reservation.status)", () => {
    // Simulate an existing schema that defined basic CartItem without customizations
    const initialSchema = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id String @id @default(uuid())
}

model CartItem {
  id       String @id @default(uuid())
  userId   String
  name     String
  quantity Int
}

model Reservation {
  id        String @id @default(uuid())
  userId    String
  name      String
  partySize Int
}
`;
    writeFileSync(PRISMA_SCHEMA_PATH, initialSchema, "utf8");

    // Reconcile with restaurant domain models
    const res = AuthorizedSchemaManager.reconcileProjectSchema(
      FIXTURE_DIR,
      ["CartItem", "Reservation"],
      "postgresql"
    );

    expect(res.success).toBe(true);
    const updatedContent = readFileSync(PRISMA_SCHEMA_PATH, "utf8");

    // Must have preserved existing fields AND enriched with domain-specific fields
    expect(updatedContent).toContain("customizations");
    expect(updatedContent).toContain("status");
    expect(updatedContent).toContain("quantity");
    expect(updatedContent).toContain("partySize");
    expect(res.addedFields).toContain("CartItem.customizations");
    expect(res.addedFields).toContain("Reservation.status");
  });

  it("3. Existing valid relations and custom fields are not silently removed", () => {
    const initialSchema = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id      String   @id @default(uuid())
  email   String   @unique
  orders  Order[]
}

model Order {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  customNote String?
}
`;
    writeFileSync(PRISMA_SCHEMA_PATH, initialSchema, "utf8");

    const res = AuthorizedSchemaManager.reconcileAndWriteSchema(
      FIXTURE_DIR,
      ["Order"],
      "SchemaEngine"
    );

    expect(res.success).toBe(true);
    const onDisk = readFileSync(PRISMA_SCHEMA_PATH, "utf8");

    // Relations and custom fields must NOT be stripped
    expect(onDisk).toContain("@relation(fields: [userId], references: [id])");
    expect(onDisk).toContain("customNote");
    expect(res.preservedFields).toContain("Order.customNote");
    expect(res.preservedFields).toContain("Order.user");
  });

  it("4. Invalid schema update is rejected without destroying the previous valid schema", () => {
    const validInitialSchema = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id String @id @default(uuid())
}
`;
    writeFileSync(PRISMA_SCHEMA_PATH, validInitialSchema, "utf8");

    // Malformed schema: missing closing brace and invalid model syntax
    const corruptedUpdate = `
model BrokenModel {
  fieldWithoutType
`;

    const res = AuthorizedSchemaManager.reconcileAndWriteSchema(
      FIXTURE_DIR,
      corruptedUpdate,
      "DatabaseAgent"
    );

    expect(res.success).toBe(false);
    expect(res.written).toBe(false);
    expect(res.error).toBeDefined();

    // Previous valid schema on disk must remain pristine!
    const onDisk = readFileSync(PRISMA_SCHEMA_PATH, "utf8");
    expect(onDisk).toBe(validInitialSchema);
  });

  it("5. Unauthorized caller cannot overwrite the canonical schema", () => {
    const validInitialSchema = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id String @id @default(uuid())
}
`;
    writeFileSync(PRISMA_SCHEMA_PATH, validInitialSchema, "utf8");

    const res = AuthorizedSchemaManager.reconcileAndWriteSchema(
      FIXTURE_DIR,
      "model HijackedModel { id String @id }",
      "FastSanitizer" // Unauthorized component!
    );

    expect(res.success).toBe(false);
    expect(res.written).toBe(false);
    expect(res.error).toContain("UNAUTHORIZED_SCHEMA_WRITER");

    // Disk content must remain untouched
    const onDisk = readFileSync(PRISMA_SCHEMA_PATH, "utf8");
    expect(onDisk).toBe(validInitialSchema);
  });
});
