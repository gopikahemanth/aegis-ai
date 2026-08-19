import { describe, it, expect } from "vitest";
import { CanonicalDataModelContract } from "../canonical-data-model.js";
import { ContractDrivenDataModelGenerator } from "../contract-driven-data-model-generator.js";
import type { ArchitectureContractV1 } from "../architecture-resolver.js";

function createMockContract(params: {
  prompt?: string;
  requiredModels?: string[];
  dbProvider?: string;
}): ArchitectureContractV1 {
  return {
    version: 1,
    status: "locked",
    prompt: params.prompt || "Build a task management application with kanban board",
    applicationType: "FULLSTACK_WEB_APPLICATION",
    architectureProfile: "Fullstack React + Express",
    source: "user_prompt",
    confidence: 1.0,
    reason: "Contract locked for test",
    userSpecified: true,
    inferred: false,
    overridden: false,
    frontend: { framework: "React-Vite", provenance: "user" },
    backend: { framework: "Express", provenance: "user" },
    database: {
      provider: params.dbProvider || "PostgreSQL",
      orm: "Prisma",
      provenance: "user",
      ormProvenance: "user",
    },
    language: "TypeScript",
    styling: "TailwindCSS",
    packageManager: "pnpm",
    authentication: "JWT",
    requiredLibraries: ["prisma", "@prisma/client"],
    requiredFeatures: ["tasks", "kanban", "auth"],
    requiredRoutes: ["/", "/dashboard"],
    requiredModels: params.requiredModels || ["User", "Task", "BoardColumn", "Project"],
    projectStructure: { src: "Frontend presentation layer" },
  };
}

describe("Fix 2: Domain-Aware Prisma Schema Integrity", () => {
  // Test 1 — Kanban schema
  it("Test 1: Kanban schema with User, Task, BoardColumn, Project validates as valid without reporting Item/Activity", () => {
    const kanbanContract = createMockContract({
      prompt: "Build a modern Task Management Application with a Kanban board, Todo/In Progress/Done columns",
      requiredModels: ["User", "Task", "BoardColumn", "Project"],
    });

    const kanbanSchema = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  createdAt DateTime @default(now())
}

model Task {
  id          String       @id @default(uuid())
  title       String
  description String?
  columnId    String
  column      BoardColumn  @relation(fields: [columnId], references: [id])
  createdAt   DateTime     @default(now())
}

model BoardColumn {
  id        String   @id @default(uuid())
  name      String
  tasks     Task[]
  createdAt DateTime @default(now())
}

model Project {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
}
`;

    // Validate using the actual project contract
    const result = CanonicalDataModelContract.validateSchema(kanbanSchema, kanbanContract);
    expect(result.valid).toBe(true);
    expect(result.missingModels).toHaveLength(0);
    expect(result.missingModels).not.toContain("Item");
    expect(result.missingModels).not.toContain("Activity");

    // Also validate when passing prompt string
    const promptResult = CanonicalDataModelContract.validateSchema(
      kanbanSchema,
      "Build a modern Task Management Application with a Kanban board"
    );
    expect(promptResult.valid).toBe(true);
    expect(promptResult.missingModels).toHaveLength(0);
  });

  // Test 2 — Generic fallback
  it("Test 2: Generic fallback remains available and valid for domain-neutral projects", () => {
    const genericContract = createMockContract({
      prompt: "",
      requiredModels: ["User", "Item", "Activity"],
    });

    const genericSchema = CanonicalDataModelContract.getPrismaSchema(genericContract);
    expect(genericSchema).toContain("model User");
    expect(genericSchema).toContain("model Item");
    expect(genericSchema).toContain("model Activity");

    const result = CanonicalDataModelContract.validateSchema(genericSchema, genericContract);
    expect(result.valid).toBe(true);
    expect(result.missingModels).toHaveLength(0);

    const modelNames = CanonicalDataModelContract.getModelNames(genericContract);
    expect(modelNames).toContain("User");
    expect(modelNames).toContain("Item");
    expect(modelNames).toContain("Activity");
  });

  // Test 3 — Different domain (E-commerce)
  it("Test 3: E-commerce schema is validated against its own domain models (User, Product, Order, Category)", () => {
    const ecommerceContract = createMockContract({
      prompt: "Build an e-commerce platform with products, shopping cart, orders, and product categories",
      requiredModels: ["User", "Product", "Order", "Category"],
    });

    const ecommerceSchema = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id    String @id @default(uuid())
  email String @unique
}

model Product {
  id    String @id @default(uuid())
  name  String
  price Float
}

model Order {
  id        String   @id @default(uuid())
  userId    String
  createdAt DateTime @default(now())
}

model Category {
  id   String @id @default(uuid())
  name String
}
`;

    const result = CanonicalDataModelContract.validateSchema(ecommerceSchema, ecommerceContract);
    expect(result.valid).toBe(true);
    expect(result.missingModels).toHaveLength(0);
    expect(result.missingModels).not.toContain("Task");
    expect(result.missingModels).not.toContain("BoardColumn");
    expect(result.missingModels).not.toContain("Item");
  });

  // Test 4 — Missing model in contract
  it("Test 4: Schema missing a required contract model reports that specific missing model, NOT generic Item/Activity", () => {
    const kanbanContract = createMockContract({
      prompt: "Build a task management application",
      requiredModels: ["User", "Task", "BoardColumn", "Project"],
    });

    // Incomplete schema: missing BoardColumn
    const incompleteSchema = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id String @id @default(uuid())
}

model Task {
  id    String @id @default(uuid())
  title String
}

model Project {
  id   String @id @default(uuid())
  name String
}
`;

    const result = CanonicalDataModelContract.validateSchema(incompleteSchema, kanbanContract);
    expect(result.valid).toBe(false);
    expect(result.missingModels).toContain("BoardColumn");
    expect(result.missingModels).not.toContain("Item");
    expect(result.missingModels).not.toContain("Activity");
  });

  // Test 5 — No-context validation safety
  it("Test 5: No-context validation safely recognizes valid schemas without forcing Item/Activity", () => {
    const validDomainSchema = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id String @id @default(uuid())
}

model Task {
  id    String @id @default(uuid())
  title String
}
`;

    // Calling validateSchema without passing a contract or prompt
    const noContextResult = CanonicalDataModelContract.validateSchema(validDomainSchema);
    expect(noContextResult.valid).toBe(true);
    expect(noContextResult.missingModels).toHaveLength(0);

    // Truly empty schema fails safely
    const emptyResult = CanonicalDataModelContract.validateSchema("");
    expect(emptyResult.valid).toBe(false);
    expect(emptyResult.missingModels.length).toBeGreaterThan(0);
  });
});
