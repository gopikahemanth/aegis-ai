import { describe, it, expect } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { SchemaModelResolver } from "../schema-model-resolver.js";

function createTempDir(prefix: string): string {
  const dir = join(tmpdir(), `aegis-schema-resolver-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function safeCleanup(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {}
}

describe("SchemaModelResolver — Structured Prisma Parsing & Non-Destructive Validation", () => {
  it("extracts models, fields, types, optionality, defaults, and relations", () => {
    const testDir = createTempDir("schema-parse");
    try {
      mkdirSync(join(testDir, "prisma"), { recursive: true });
      writeFileSync(
        join(testDir, "prisma", "schema.prisma"),
        `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  tasks     Task[]
  createdAt DateTime @default(now())
}

model Task {
  id          String    @id @default(uuid())
  title       String
  description String?
  priority    Priority  @default(MEDIUM)
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  tags        TaskTag[]
  createdAt   DateTime  @default(now())
}

model TaskTag {
  id     String @id @default(uuid())
  name   String
  taskId String
  task   Task   @relation(fields: [taskId], references: [id])
}
`,
        "utf8"
      );

      const resolver = new SchemaModelResolver(testDir);
      const res = resolver.analyzeProject();

      expect(res.models.length).toBe(3);
      expect(res.enums.length).toBe(1);
      expect(res.enums[0].name).toBe("Priority");
      expect(res.enums[0].values).toContain("HIGH");

      const taskModel = res.models.find(m => m.name === "Task");
      expect(taskModel).toBeDefined();

      const titleField = taskModel?.fields.find(f => f.name === "title");
      expect(titleField?.isOptional).toBe(false);

      const descField = taskModel?.fields.find(f => f.name === "description");
      expect(descField?.isOptional).toBe(true);

      const prioField = taskModel?.fields.find(f => f.name === "priority");
      expect(prioField?.hasDefault).toBe(true);
      expect(prioField?.defaultValue).toBe("MEDIUM");

      const userRel = taskModel?.fields.find(f => f.name === "user");
      expect(userRel?.isRelation).toBe(true);
      expect(userRel?.relationModel).toBe("User");
      expect(userRel?.relationFromFields).toContain("userId");
      expect(userRel?.relationToFields).toContain("id");
    } finally {
      safeCleanup(testDir);
    }
  });

  it("validates additive vs destructive schema changes", () => {
    const testDir = createTempDir("schema-validation");
    try {
      const resolver = new SchemaModelResolver(testDir);

      // Safe: Optional field
      const resOpt = resolver.validateSchemaChange("Task", "ADD_FIELD", {
        name: "priority",
        type: "String",
        isOptional: true,
      });
      expect(resOpt.safe).toBe(true);

      // Safe: Field with default
      const resDef = resolver.validateSchemaChange("Task", "ADD_FIELD", {
        name: "archived",
        type: "Boolean",
        isOptional: false,
        defaultValue: "false",
      });
      expect(resDef.safe).toBe(true);

      // Unsafe: Non-nullable field without default
      const resNonNullable = resolver.validateSchemaChange("Task", "ADD_FIELD", {
        name: "requiredMeta",
        type: "String",
        isOptional: false,
      });
      expect(resNonNullable.safe).toBe(false);
      expect(resNonNullable.reason).toContain("DESTRUCTIVE_SCHEMA_MIGRATION_BLOCKED");

      // Unsafe: Dropping column
      const resDrop = resolver.validateSchemaChange("Task", "DROP_FIELD", {
        name: "title",
        type: "String",
      });
      expect(resDrop.safe).toBe(false);
      expect(resDrop.reason).toContain("DESTRUCTIVE_SCHEMA_MIGRATION_BLOCKED");
    } finally {
      safeCleanup(testDir);
    }
  });
});
