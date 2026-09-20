import { describe, it, expect } from "vitest";
import { DatabaseVerifier } from "../database-verifier.js";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("DatabaseVerifier (16-Point Verification Engine)", () => {
  it("rejects generic models like Record, Item, Entry", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "aegis-db-test-"));
    const prismaDir = join(tempDir, "prisma");
    mkdirSync(prismaDir, { recursive: true });

    const genericSchema = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Record {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
}
`;
    writeFileSync(join(prismaDir, "schema.prisma"), genericSchema, "utf8");

    try {
      const report = await DatabaseVerifier.verify(tempDir);
      expect(report.passed).toBe(false);
      expect(report.rejectedGenericEntities).toContain("Record");
      const check2 = report.checks.find(c => c.checkId === 2);
      expect(check2?.passed).toBe(false);
      expect(check2?.message).toContain("forbidden generic entities");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("passes 16-point verification on domain-authentic schema", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "aegis-db-test-domain-"));
    const prismaDir = join(tempDir, "prisma");
    mkdirSync(prismaDir, { recursive: true });

    const domainSchema = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model GlazeRecipe {
  id           String             @id @default(uuid())
  title        String
  coneTarget   Int
  atmosphere   String
  components   GlazeComponent[]
  createdAt    DateTime           @default(now())
}

model GlazeComponent {
  id           String      @id @default(uuid())
  materialName String
  percentage   Float
  recipeId     String
  recipe       GlazeRecipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
}

model KilnFiringSchedule {
  id            String   @id @default(uuid())
  name          String
  targetTempC   Float
  rampRatePerHour Float
  status        String   @default("PLANNED")
  createdAt     DateTime @default(now())
}
`;
    writeFileSync(join(prismaDir, "schema.prisma"), domainSchema, "utf8");

    try {
      const report = await DatabaseVerifier.verify(tempDir);
      expect(report.passed).toBe(true);
      expect(report.score).toBeGreaterThanOrEqual(85);
      expect(report.modelsVerified).toContain("GlazeRecipe");
      expect(report.modelsVerified).toContain("GlazeComponent");
      expect(report.modelsVerified).toContain("KilnFiringSchedule");
      expect(report.rejectedGenericEntities).toHaveLength(0);
      expect(report.checks.length).toBe(16);
    } finally {
      try {
        rmSync(tempDir, { recursive: true, force: true });
      } catch {}
    }
  });
});
