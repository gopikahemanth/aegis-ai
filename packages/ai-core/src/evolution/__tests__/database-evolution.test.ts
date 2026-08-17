import { describe, it, expect } from "vitest";
import { DatabaseEvolutionManager } from "../database-evolution-manager.js";

describe("DatabaseEvolutionManager", () => {
  const schemaV1 = `
datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL")
}

model User {
  id Int @id @default(autoincrement())
  email String @unique
}

model Member {
  id Int @id @default(autoincrement())
  name String
}
`;

  it("classifies additive changes as SAFE_MIGRATION", () => {
    const schemaV2Safe = `
datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL")
}

model User {
  id Int @id @default(autoincrement())
  email String @unique
}

model Member {
  id Int @id @default(autoincrement())
  name String
  phone String?
}

model Workout {
  id Int @id @default(autoincrement())
  title String
}
`;

    const plan = DatabaseEvolutionManager.planEvolution(schemaV1, schemaV2Safe);
    expect(plan.isSafe).toBe(true);
    expect(plan.hasDestructiveChanges).toBe(false);
    expect(plan.migrationStrategy).toBe("AUTO_MIGRATE");
  });

  it("classifies dropping a model as DESTRUCTIVE_MIGRATION requiring explicit confirmation", () => {
    const schemaV2Destructive = `
datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL")
}

model User {
  id Int @id @default(autoincrement())
  email String @unique
}
`;

    const plan = DatabaseEvolutionManager.planEvolution(schemaV1, schemaV2Destructive);
    expect(plan.isSafe).toBe(false);
    expect(plan.hasDestructiveChanges).toBe(true);
    expect(plan.migrationStrategy).toBe("REQUIRE_EXPLICIT_CONFIRMATION");
  });
});
